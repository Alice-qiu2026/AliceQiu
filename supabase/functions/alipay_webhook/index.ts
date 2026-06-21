import { createClient } from 'npm:@supabase/supabase-js@2.47.0';
import { createVerify } from 'node:crypto';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALIPAY_PUBLIC_KEY = Deno.env.get('ALIPAY_PUBLIC_KEY') || '';

// 会员 SKU → {type, months} 映射
const MEMBERSHIP_SKU: Record<string, { type: string; months: number }> = {
  'member-standard-monthly': { type: 'standard', months: 1 },
  'member-standard-yearly':  { type: 'standard', months: 12 },
  'member-premium-monthly':  { type: 'premium',  months: 1 },
  'member-premium-yearly':   { type: 'premium',  months: 12 },
};

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

  const { data: p } = await supabase
    .from('profiles')
    .select('membership_expires_at')
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

  console.log(`[alipay_webhook] User ${userId} upgraded to ${highestMembership} until ${base.toISOString()}`);
  return highestMembership;
}

// 验证支付宝签名
function verifyAlipaySign(params: Record<string, string>): boolean {
  const sign = params.sign;
  if (!sign) return false;

  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'sign' && k !== 'sign_type' && v !== undefined && v !== '') {
      filtered[k] = v;
    }
  }

  const keys = Object.keys(filtered).sort();
  const data = keys.map(k => `${k}=${decodeURIComponent(filtered[k])}`).join('&');

  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(data, 'utf8');
    return verifier.verify(ALIPAY_PUBLIC_KEY, sign, 'base64');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const bodyText = await req.text();
    const params: Record<string, string> = {};
    for (const [k, v] of new URLSearchParams(bodyText)) {
      params[k] = v;
    }

    console.log('[alipay_webhook] received params:', JSON.stringify(params));

    if (!verifyAlipaySign(params)) {
      console.error('[alipay_webhook] 签名验证失败');
      return new Response('fail', { status: 400 });
    }

    const tradeStatus = params.trade_status;
    const orderNo = params.out_trade_no;

    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return new Response('success', { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_no', orderNo)
      .single();

    if (orderErr || !order) {
      console.error('[alipay_webhook] order not found:', orderNo);
      return new Response('fail', { status: 400 });
    }

    if (order.status === 'paid' || order.status === 'completed') {
      return new Response('success', { status: 200 });
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('order_no', orderNo)
      .eq('status', 'pending');

    if (updateErr) {
      console.error('[alipay_webhook] update order failed:', updateErr);
      return new Response('fail', { status: 500 });
    }

    const orderItems: Array<{ sku_code: string; quantity: number }> = order.order_items || [];

    // 1. 会员升级
    const newMembership = await applyMembershipUpgrade(supabase, order.user_id, orderItems);

    // 2. 魔镜报告增加
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
      console.log(`[alipay_webhook] User ${order.user_id} mirror reports +${extraReports}, now ${newCount}`);
    }

    // 3. 邀请奖励（tier-aware，仅会员购买时触发）
    if (newMembership) {
      const { error: rewardErr } = await supabase.rpc('grant_invite_reward', {
        p_invitee_id: order.user_id,
        p_new_membership: newMembership,
      });
      if (rewardErr) {
        console.error('[alipay_webhook] grant_invite_reward error:', rewardErr);
      } else {
        console.log(`[alipay_webhook] Invite reward granted for invitee ${order.user_id}`);
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

    return new Response('success', { status: 200 });
  } catch (err: any) {
    console.error('[alipay_webhook ERROR]', err);
    return new Response('fail', { status: 500 });
  }
});

// 验证支付宝签名
function verifyAlipaySign(params: Record<string, string>): boolean {
  const sign = params.sign;
  if (!sign) return false;

  // 移除 sign 和 sign_type
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'sign' && k !== 'sign_type' && v !== undefined && v !== '') {
      filtered[k] = v;
    }
  }

  const keys = Object.keys(filtered).sort();
  const data = keys.map(k => `${k}=${decodeURIComponent(filtered[k])}`).join('&');

  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(data, 'utf8');
    return verifier.verify(ALIPAY_PUBLIC_KEY, sign, 'base64');
  } catch {
    return false;
  }
}


