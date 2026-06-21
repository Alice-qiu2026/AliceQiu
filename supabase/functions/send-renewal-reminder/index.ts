import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SMS_API_URL = 'https://app-cc2fqeuowe81-api-W9z3M74x6ZNL-gateway.appmiaoda.com/v1/code/send_message';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  // 验证方法
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { user_id } = await req.json().catch(() => ({}));

    // 查询即将到期的付费会员（7天内到期，且未发送过提醒）
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    let query = supabase
      .from('profiles')
      .select('id, phone, email, membership_type, membership_expires_at, full_name')
      .in('membership_type', ['standard', 'premium'])
      .lte('membership_expires_at', sevenDaysLater.toISOString())
      .gt('membership_expires_at', new Date().toISOString())
      .eq('renewal_reminder_sent', false);

    // 如果指定了 user_id，只处理该用户
    if (user_id) {
      query = query.eq('id', user_id);
    }

    const { data: users, error: queryError } = await query;

    if (queryError) {
      console.error('查询失败:', queryError);
      return new Response(JSON.stringify({ error: '查询失败', detail: queryError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: '暂无需要提醒的会员', count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');

    for (const user of users) {
      const daysLeft = Math.ceil(
        (new Date(user.membership_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const message = `【跨境家和】尊敬的${user.full_name || '用户'}，您的${user.membership_type === 'premium' ? '高级' : '普通'}会员将于${daysLeft}天后到期。请及时续费，避免服务中断。详情访问跨境家和官网会员中心。`;

      let status: string = 'pending';
      let errorMsg: string | null = null;
      let sentAt: string | null = null;

      // 尝试发送短信通知
      if (user.phone && apiKey) {
        try {
          const resp = await fetch(SMS_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Gateway-Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ mobile: user.phone }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.status === 0) {
              status = 'sent';
              sentAt = new Date().toISOString();
            } else {
              status = 'failed';
              errorMsg = `短信网关返回错误: ${data.msg}`;
            }
          } else {
            status = 'failed';
            errorMsg = `短信网关HTTP错误: ${resp.status}`;
          }
        } catch (e: any) {
          status = 'failed';
          errorMsg = `短信发送异常: ${e.message}`;
        }
      } else {
        status = 'failed';
        errorMsg = !user.phone ? '用户未绑定手机号' : '未配置短信API密钥';
      }

      // 记录通知
      const { error: insertError } = await supabase.from('renewal_reminders').insert({
        user_id: user.id,
        channel: 'sms',
        status,
        message,
        error_message: errorMsg,
        sent_at: sentAt,
      });

      if (insertError) {
        console.error('记录通知失败:', insertError);
      }

      // 标记已提醒（无论成功与否，避免重复发送）
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ renewal_reminder_sent: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('更新用户提醒状态失败:', updateError);
      }

      results.push({
        user_id: user.id,
        phone: user.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}` : null,
        status,
        error: errorMsg,
      });
    }

    return new Response(
      JSON.stringify({ message: '处理完成', count: results.length, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('Edge Function 错误:', err);
    return new Response(JSON.stringify({ error: '处理失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
