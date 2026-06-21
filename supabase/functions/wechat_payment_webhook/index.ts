import { createClient } from 'npm:@supabase/supabase-js@2.47.0';
import { Aes } from 'npm:wechatpay-axios-plugin@1.1.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MCH_API_V3_KEY = Deno.env.get('MCH_API_V3_KEY') || '';

// 会员 SKU → {type, months} 映射
const MEMBERSHIP_SKU: Record<string, { type: string; months: number }> = {
  'member-standard-monthly': { type: 'standard', months: 1 },
  'member-standard-yearly':  { type: 'standard', months: 12 },
  'member-premium-monthly':  { type: 'premium',  months: 1 },
  'member-premium-yearly':   { type: 'premium',  months: 12 },
};

async function decryptTradeState(associatedData: string, nonce: string, ciphertext: string) {
  try {
    const plaintext = await Aes.AesGcm.decrypt(ciphertext, MCH_API_V3_KEY, nonce, associatedData);
    const obj = JSON.parse(plaintext);
    return {
      status: (obj.trade_state ?? '').toString() === 'SUCCESS' ? 'SUCCESS' : 'OTHERS',
      order_no: obj.out_trade_no ?? '',
    };
  } catch (err: any) {
    console.error('[decryptTradeState ERROR]', err);
    return { status: 'ERROR', order_no: '' };
  }
}

/** 根据已购 SKU 列表升级会员，返回新会员等级（供邀请奖励使用） */
async function applyMembershipUpgrade(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  orderItems: Array<{ sku_code: string; quantity: number }>,
): Promise<string | null> {
  let highestMembership: string | null = null;
  let totalMonths = 0;

  for (const item of orderItems) {
    const mapping = MEMBERSHIP_SKU[item.sku_code];
    if (!mapping) continue;
    totalMonths += mapping.months * (item.quantity || 1);
    if (!highestMembership || mapping.type === 'premium') {
      highestMembership = mapping.type;
    }
  }

  if (!highestMembership || totalMonths === 0) return null;

  // 读取当前到期时间
  const { data: p } = await supabase
    .from('profiles')
    .select('membership_expires_at, membership_type')
    .eq('id', userId)
    .single();

  const base = p?.membership_expires_at && new Date(p.membership_expires_at) > new Date()
    ? new Date(p.membership_expires_at)
    : new Date();

  base.setMonth(base.getMonth() + totalMonths);

  await supabase
    .from('profiles')
    .update({
      membership_type: highestMembership,
      membership_expires_at: base.toISOString(),
      renewal_reminder_sent: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`[wechat_webhook] User ${userId} upgraded to ${highestMembership} until ${base.toISOString()}`);
  return highestMembership;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const body = await req.json();
    console.log('[wechat_webhook] received body:', JSON.stringify(body));

    if (!body.resource || !body.resource.ciphertext) {
      return new Response(JSON.stringify({ code: 'FAIL', message: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { ciphertext, associated_data, nonce } = body.resource;
    const decrypted = await decryptTradeState(associated_data, nonce, ciphertext);
    console.log('[wechat_webhook] decrypted:', JSON.stringify(decrypted));

    if (decrypted.status !== 'SUCCESS' || !decrypted.order_no) {
      return new Response(JSON.stringify({ code: 'SUCCESS', message: 'Ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_no', decrypted.order_no)
      .single();

    if (orderErr || !order) {
      console.error('[wechat_webhook] order not found:', decrypted.order_no);
      return new Response(JSON.stringify({ code: 'FAIL', message: 'Order not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'paid' || order.status === 'completed') {
      return new Response(JSON.stringify({ code: 'SUCCESS', message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 更新订单状态
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('order_no', decrypted.order_no)
      .eq('status', 'pending');

    if (updateErr) {
      console.error('[wechat_webhook] update order failed:', updateErr);
      return new Response(JSON.stringify({ code: 'FAIL', message: 'Update failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orderItems: Array<{ sku_code: string; quantity: number }> = order.order_items || [];

    // 1. 如果购买了会员 → 升级会员资格
    const newMembership = await applyMembershipUpgrade(supabase, order.user_id, orderItems);

    // 2. 如果购买了魔镜报告 → 增加 free_reports_remaining
    const mirrorItems = orderItems.filter((i) => i.sku_code === 'mirror-report');
    if (mirrorItems.length > 0) {
      const extraReports = mirrorItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
      const { data: p } = await supabase
        .from('profiles')
        .select('free_reports_remaining')
        .eq('id', order.user_id)
        .single();
      const newCount = (p?.free_reports_remaining || 0) + extraReports;
      await supabase
        .from('profiles')
        .update({ free_reports_remaining: newCount, updated_at: new Date().toISOString() })
        .eq('id', order.user_id);
      console.log(`[wechat_webhook] User ${order.user_id} mirror reports +${extraReports}, now ${newCount}`);
    }

    // 3. 邀请奖励：仅在购买了会员时触发（tier-aware）
    if (newMembership) {
      const { error: rewardErr } = await supabase.rpc('grant_invite_reward', {
        p_invitee_id: order.user_id,
        p_new_membership: newMembership,
      });
      if (rewardErr) {
        console.error('[wechat_webhook] grant_invite_reward error:', rewardErr);
      } else {
        console.log(`[wechat_webhook] Invite reward granted for invitee ${order.user_id}`);
      }
    }

    // 4. 库存管理
    for (const item of orderItems) {
      await supabase.rpc('manage_sku_inventory', {
        sku_code_in: item.sku_code,
        qty_in: item.quantity,
        action: 'pay_success',
      });
    }

    return new Response(JSON.stringify({ code: 'SUCCESS', message: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[wechat_webhook ERROR]', err);
    return new Response(JSON.stringify({ code: 'FAIL', message: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});


