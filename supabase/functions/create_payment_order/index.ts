import { createClient } from 'npm:@supabase/supabase-js@2.47.0';
import { Wechatpay } from 'npm:wechatpay-axios-plugin@1.1.4';
import ShortUniqueId from 'npm:short-unique-id@5.2.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MERCHANT_ID = Deno.env.get('MERCHANT_ID') || '';
const MERCHANT_APP_ID = Deno.env.get('MERCHANT_APP_ID') || '';
const MCH_CERT_SERIAL_NO = Deno.env.get('MCH_CERT_SERIAL_NO') || '';
const MCH_PRIVATE_KEY = Deno.env.get('MCH_PRIVATE_KEY') || '';
const WECHAT_PAY_PUBLIC_KEY_ID = Deno.env.get('WECHAT_PAY_PUBLIC_KEY_ID') || '';
const WECHAT_PAY_PUBLIC_KEY = Deno.env.get('WECHAT_PAY_PUBLIC_KEY') || '';

function generateOrderNo() {
  const uid = new ShortUniqueId({ length: 8 });
  const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `ORD-${yymmdd}-${uid.rnd()}`;
}

async function createWechatPayUrl(outTradeNo: string, amount: number, notifyUrl: string) {
  try {
    const wxpay = new Wechatpay({
      mchid: MERCHANT_ID,
      serial: MCH_CERT_SERIAL_NO,
      privateKey: MCH_PRIVATE_KEY,
      certs: { [WECHAT_PAY_PUBLIC_KEY_ID]: WECHAT_PAY_PUBLIC_KEY }
    });
    const res = await wxpay.v3.pay.transactions.native.post({
      mchid: MERCHANT_ID,
      out_trade_no: outTradeNo,
      appid: MERCHANT_APP_ID,
      description: '跨境家和·魔镜初筛报告',
      notify_url: notifyUrl,
      amount: { total: Math.round(amount * 100) }
    }, { headers: { 'Wechatpay-Serial': WECHAT_PAY_PUBLIC_KEY_ID } });
    if (res.data.code_url) {
      console.log(`[WeChatPay SUCCESS] outTradeNo=${outTradeNo}, url=${res.data.code_url}`);
      return { success: true, url: res.data.code_url };
    } else {
      console.error(`[WeChatPay FAILED] outTradeNo=${outTradeNo}, error=${res.data.message || JSON.stringify(res.data)}`);
      return { success: false, error: res.data.message || JSON.stringify(res.data) };
    }
  } catch (err: any) {
    console.error(`[WeChatPay ERROR] outTradeNo=${outTradeNo}, error=${err?.message || String(err)}`);
    return { success: false, error: err?.message || String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const body = await req.json();
    const { sku_code, quantity = 1 } = body;

    // 从 auth header 获取用户信息
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: '用户未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 检查密钥是否配置
    if (!MERCHANT_ID || !MERCHANT_APP_ID || !MCH_PRIVATE_KEY || !MCH_CERT_SERIAL_NO) {
      return new Response(JSON.stringify({ error: '微信支付密钥未配置，请联系管理员' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 查询 SKU 信息
    const { data: sku, error: skuErr } = await supabase
      .from('sku')
      .select('*')
      .eq('sku_code', sku_code)
      .single();

    if (skuErr || !sku) {
      return new Response(JSON.stringify({ error: '商品不存在' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const totalAmount = sku.price * quantity;
    const orderNo = generateOrderNo();
    const notifyUrl = `${supabaseUrl.replace('/rest/v1', '')}/functions/v1/wechat_payment_webhook`;

    // 创建微信支付 URL
    const payResult = await createWechatPayUrl(orderNo, totalAmount, notifyUrl);
    if (!payResult.success) {
      return new Response(JSON.stringify({ error: '创建微信支付失败：' + payResult.error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 创建订单
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        status: 'pending',
        wechat_pay_url: payResult.url,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: '创建订单失败' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 创建订单明细
    await supabase.from('order_items').insert({
      order_id: order.id,
      sku_code: sku_code,
      quantity: quantity,
      unit_price: sku.price,
      total_price: totalAmount,
      sku_snapshot: sku,
    });

    // 冻结库存（虚拟商品不限制，但还是执行）
    await supabase.rpc('manage_sku_inventory', {
      sku_code_in: sku_code,
      qty_in: quantity,
      action: 'order',
    });

    return new Response(JSON.stringify({
      success: true,
      order_no: orderNo,
      order_id: order.id,
      wechat_pay_url: payResult.url,
      total_amount: totalAmount,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[create_payment_order ERROR]', err);
    return new Response(JSON.stringify({ error: err.message || '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
