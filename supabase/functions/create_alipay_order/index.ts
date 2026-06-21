import { createClient } from 'npm:@supabase/supabase-js@2.47.0';
import { createSign } from 'node:crypto';
import ShortUniqueId from 'npm:short-unique-id@5.2.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALIPAY_APP_ID = Deno.env.get('ALIPAY_APP_ID') || '';
const ALIPAY_PRIVATE_KEY = Deno.env.get('ALIPAY_PRIVATE_KEY') || '';

function generateOrderNo() {
  const uid = new ShortUniqueId({ length: 8 });
  const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `ORD-${yymmdd}-${uid.rnd()}`;
}

// 按key排序并拼接参数字符串
function buildSortedParams(params: Record<string, string>) {
  const keys = Object.keys(params).sort();
  return keys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
}

// RSA2 签名
function rsaSign(data: string, privateKey: string): string {
  const signer = createSign('RSA-SHA256');
  signer.update(data, 'utf8');
  return signer.sign(privateKey, 'base64');
}

async function createAlipayQrCode(outTradeNo: string, totalAmount: number, notifyUrl: string) {
  const bizContent = JSON.stringify({
    out_trade_no: outTradeNo,
    total_amount: totalAmount.toFixed(2),
    subject: '跨境家和·魔镜初筛报告',
    product_code: 'FACE_TO_FACE_PAYMENT',
  });

  const params: Record<string, string> = {
    app_id: ALIPAY_APP_ID,
    method: 'alipay.trade.precreate',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    version: '1.0',
    notify_url: notifyUrl,
    biz_content: bizContent,
  };

  const signString = buildSortedParams(params);
  params.sign = rsaSign(signString, ALIPAY_PRIVATE_KEY);

  const formData = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    formData.append(k, v);
  }

  const res = await fetch('https://openapi.alipay.com/gateway.do', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: formData.toString(),
  });

  const result = await res.json();
  const resp = result.alipay_trade_precreate_response;

  if (resp?.code === '10000') {
    return { success: true, qr_code: resp.qr_code };
  } else {
    return { success: false, error: resp?.msg || resp?.sub_msg || JSON.stringify(result) };
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: '用户未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!ALIPAY_APP_ID || !ALIPAY_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: '支付宝密钥未配置，请联系管理员' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

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
    const notifyUrl = `${supabaseUrl.replace('/rest/v1', '')}/functions/v1/alipay_webhook`;

    const payResult = await createAlipayQrCode(orderNo, totalAmount, notifyUrl);
    if (!payResult.success) {
      return new Response(JSON.stringify({ error: '创建支付宝订单失败：' + payResult.error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: user.id,
        status: 'pending',
        pay_type: 'alipay',
        alipay_pay_url: payResult.qr_code,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: '创建订单失败' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      sku_code: sku_code,
      quantity: quantity,
      unit_price: sku.price,
      total_price: totalAmount,
      sku_snapshot: sku,
    });

    await supabase.rpc('manage_sku_inventory', {
      sku_code_in: sku_code,
      qty_in: quantity,
      action: 'order',
    });

    return new Response(JSON.stringify({
      success: true,
      order_no: orderNo,
      order_id: order.id,
      alipay_pay_url: payResult.qr_code,
      total_amount: totalAmount,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('[create_alipay_order ERROR]', err);
    return new Response(JSON.stringify({ error: err.message || '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
