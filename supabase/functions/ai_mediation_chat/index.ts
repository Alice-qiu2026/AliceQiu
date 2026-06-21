import { createClient } from 'npm:@supabase/supabase-js@2.47.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTEGRATIONS_API_KEY = Deno.env.get('INTEGRATIONS_API_KEY') || '';

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
    const { message, mode = 'single', history = [] } = body;

    // 验证登录
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: '用户未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 构建系统提示词
    const systemPrompt = mode === 'dual'
      ? `你是「蓝仙女」，一位温和、专业的 AI 家庭调解助手。你正在协助一对家庭成员进行双人调解。
你的角色是：
1. 中立客观地理解双方的诉求和情绪
2. 帮助双方找到共同点，促进相互理解
3. 提供中加跨文化背景下的沟通建议
4. 保持温和、耐心的语气，不评判任何一方
5. 适当引用加拿大法律文化知识作为参考
注意：你提供的是情感支持与信息参考，不构成正式法律意见。`
      : `你是「蓝仙女」，一位温柔、专业的 AI 倾诉陪伴助手。你正在倾听一位用户的倾诉。
你的角色是：
1. 认真倾听用户的困扰，给予情感支持和共情
2. 从法律和文化角度提供参考信息
3. 帮助用户梳理思路，找到问题的关键点
4. 保持温柔、理解的语气，让用户感到被接纳
5. 适当引用加拿大法律文化知识作为参考
注意：你提供的是情感支持与信息参考，不构成正式法律意见。`;

    // 构建对话历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // 调用 MiniMax API
    const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTEGRATIONS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai_mediation_chat] API error:', errText);
      return new Response(JSON.stringify({ error: 'AI 服务暂时不可用，请稍后重试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const result = await response.json();
    const aiReply = result.choices?.[0]?.message?.content || '蓝仙女正在思考中，请稍后再试～';

    return new Response(JSON.stringify({
      success: true,
      reply: aiReply,
      mode,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[ai_mediation_chat ERROR]', err);
    return new Response(JSON.stringify({ error: err.message || '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
