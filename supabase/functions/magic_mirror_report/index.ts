import { createClient } from 'npm:@supabase/supabase-js@2.47.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const SILICONFLOW_API_KEY = Deno.env.get('SILICONFLOW_API_KEY') || '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// ── 语言检测 ──────────────────────────────────────────────
function detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
  const total = text.length;
  if (total === 0) return 'zh';
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const ratio = zhChars / total;
  if (ratio > 0.4) return 'zh';
  if (ratio < 0.1) return 'en';
  return 'mixed';
}

// ── 构建分析提示词 ─────────────────────────────────────────
function buildPrompt(
  subjectName: string,
  relationship: string,
  background: string,
  assets: string,
  lang: 'zh' | 'en' | 'mixed',
): string {
  const isZh = lang !== 'en';
  return isZh
    ? `你是「魔镜」——跨境家庭关系风险筛查 AI。请根据以下信息，输出结构化 JSON 风险评估报告。

调查对象：${subjectName}
关系类型：${relationship || '未指定'}
背景描述：${background || '无'}
资产/财务信息：${assets || '无'}

【风险等级判定规则】
- high（红灯-高风险）：满足任一即触发：有法院被执行人记录、有未结诉讼或刑事案件、企业被吊销/经营异常、身份完全无法验证、资产声明与公开信息严重矛盾、存在家暴/欺诈相关记录
- medium（黄灯-需关注）：满足任一但无高风险项：婚龄<1年且对方无公开信息、声明资产无法佐证、有过往已结诉讼、信息缺失超过3项、用户材料与公开信息存在差异
- low（绿灯-低风险）：身份可验证且信息基本吻合、无负面公开记录、资产声明有公开信息佐证
- unknown（白灯-信息不足）：所有公开渠道均无此人记录，或信息量不足以做出任何判断

【综合评级四档】
- "🔴 红灯 - 高风险" / "🟡 黄灯 - 需关注" / "🟢 绿灯 - 低风险" / "⚪ 白灯 - 信息不足"

请严格按以下 JSON 格式输出（不要有任何前缀文字，不要截断 JSON）：
{
  "identityVerification": {
    "name": "<对象姓名>",
    "age": "<根据背景推断的年龄区间，如 30-40，无法推断填 '未知'>",
    "occupation": "<职业或推断>",
    "location": "<所在地或推断>",
    "nationality": "<国籍背景推断>"
  },
  "riskSignals": [
    {
      "category": "<风险类别，如：身份核实、财务状况、法律风险、文化差异、跨境关系>",
      "level": "<low | medium | high | unknown>",
      "description": "<100字以内的具体风险描述>"
    }
  ],
  "overallRating": "<🔴 红灯 - 高风险 | 🟡 黄灯 - 需关注 | 🟢 绿灯 - 低风险 | ⚪ 白灯 - 信息不足>",
  "recommendations": ["<建议1>", "<建议2>", "<建议3>"],
  "actionChecklist": {
    "online": ["<线上核查项1>", "<线上核查项2>", "<线上核查项3>"],
    "proactive": ["<主动核实项1>", "<主动核实项2>"],
    "onsite": ["<现场核查项1>", "<现场核查项2>"]
  }
}`
    : `You are "Magic Mirror" — a cross-border family relationship risk screening AI. Analyze the following and output a structured JSON risk assessment report.

Subject: ${subjectName}
Relationship type: ${relationship || 'Not specified'}
Background: ${background || 'None'}
Assets/Financial info: ${assets || 'None'}

[Risk Level Rules]
- high (Red): Any of: court enforcement record, pending litigation/criminal case, revoked business license, identity unverifiable, severe asset contradiction, domestic violence/fraud record
- medium (Yellow): Any of (no red flags): marriage <1yr with no public info, unverifiable assets, past resolved litigation, >3 missing info fields, discrepancy between provided info and public records
- low (Green): Verifiable identity, no negative public records, assets corroborated
- unknown (White): No public records found at all, insufficient info to assess

Output ONLY valid JSON (no preamble, do not truncate):
{
  "identityVerification": {
    "name": "<subject name>",
    "age": "<inferred age range, e.g. 30-40, or 'Unknown'>",
    "occupation": "<occupation or inference>",
    "location": "<location or inference>",
    "nationality": "<nationality background inference>"
  },
  "riskSignals": [
    {
      "category": "<risk category, e.g.: Identity, Financial, Legal, Cultural, Cross-border>",
      "level": "<low | medium | high | unknown>",
      "description": "<specific risk description under 100 words>"
    }
  ],
  "overallRating": "<🔴 Red - High Risk | 🟡 Yellow - Attention | 🟢 Green - Low Risk | ⚪ White - Insufficient Info>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "actionChecklist": {
    "online": ["<online check 1>", "<online check 2>", "<online check 3>"],
    "proactive": ["<proactive verification 1>", "<proactive verification 2>"],
    "onsite": ["<onsite check 1>", "<onsite check 2>"]
  }
}`;
}

// ── 调用单个 OpenAI 兼容接口 ──────────────────────────────
async function callModel(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  label: string;
  timeoutMs?: number;
}): Promise<{ label: string; data: Record<string, unknown> | null; ms: number }> {
  const start = Date.now();
  const { baseUrl, apiKey, model, prompt, label, timeoutMs = 25000 } = params;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    clearTimeout(timer);

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[magic_mirror] ${label} HTTP ${resp.status}:`, errText);
      return { label, data: null, ms: Date.now() - start };
    }

    const json = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content || '';

    // 从内容中解析 JSON（有时模型会在 JSON 前后加文字）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[magic_mirror] ${label} no JSON in response:`, content.slice(0, 200));
      return { label, data: null, ms: Date.now() - start };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`[magic_mirror] ${label} OK in ${Date.now() - start}ms`);
    return { label, data: parsed, ms: Date.now() - start };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[magic_mirror] ${label} error:`, msg);
    return { label, data: null, ms: Date.now() - start };
  }
}

// ── 合成引擎 ─────────────────────────────────────────────
function synthesize(
  results: Array<{ label: string; data: Record<string, unknown> | null; ms: number }>,
  subjectName: string,
): Record<string, unknown> {
  // 取成功的结果
  const valid = results.filter((r) => r.data !== null);

  if (valid.length === 0) {
    // 全部失败 → 降级报告
    return {
      identityVerification: {
        name: subjectName,
        age: '未知',
        occupation: '未知',
        location: '未知',
        nationality: '未知',
      },
      riskSignals: [
        {
          category: '系统提示',
          level: 'medium',
          description: 'AI 分析服务暂时不可用，请稍后重试或联系客服。',
        },
      ],
      overallRating: 'N/A 无法分析',
      recommendations: ['请稍后重试', '如紧急需要请联系客服', '可提供更多背景信息后重新筛查'],
      actionChecklist: { online: [], proactive: [], onsite: [] },
      _meta: { modelsUsed: 0, totalModels: results.length, synthesisNote: '所有模型均无响应' },
    };
  }

  // 取响应最快的有效结果作为主体
  const primary = valid.sort((a, b) => a.ms - b.ms)[0];
  const base = primary.data as Record<string, unknown>;

  // 合并其他模型的 riskSignals（去重 + 补充）
  const allSignals: Array<{ category: string; level: string; description: string }> = [];
  const seenCategories = new Set<string>();

  for (const r of valid) {
    const d = r.data as Record<string, unknown>;
    // 过滤掉非对象条目（AI 偶尔会把字段名混入数组）
    const rawSignals = Array.isArray(d?.riskSignals) ? d.riskSignals : [];
    const signals = (rawSignals as unknown[]).filter(
      (s): s is { category: string; level: string; description: string } =>
        typeof s === 'object' && s !== null && 'category' in s && 'level' in s,
    );
    for (const s of signals) {
      const key = s.category?.toLowerCase() || '';
      if (!seenCategories.has(key)) {
        seenCategories.add(key);
        allSignals.push(s);
      } else {
        // 同类别取更高风险等级
        const idx = allSignals.findIndex((x) => x.category?.toLowerCase() === key);
        if (idx >= 0) {
          const levels = ['low', 'medium', 'high'];
          if (levels.indexOf(s.level) > levels.indexOf(allSignals[idx].level)) {
            allSignals[idx].level = s.level;
          }
        }
      }
    }
  }

  // 合并建议（去重）
  const allRecs: string[] = [];
  const seenRecs = new Set<string>();
  for (const r of valid) {
    const d = r.data as Record<string, unknown>;
    const recs = (d?.recommendations || []) as string[];
    for (const rec of recs) {
      const norm = rec.slice(0, 20);
      if (!seenRecs.has(norm)) {
        seenRecs.add(norm);
        allRecs.push(rec);
      }
    }
  }

  // 检测高风险分歧（一个模型说 low，另一个说 high）
  const divergences: string[] = [];
  if (valid.length > 1) {
    for (const cat of seenCategories) {
      const levels = valid.map((r) => {
        const d = r.data as Record<string, unknown>;
        const rawSignals = Array.isArray(d?.riskSignals) ? d.riskSignals : [];
        const signals = (rawSignals as unknown[]).filter(
          (s): s is { category: string; level: string } =>
            typeof s === 'object' && s !== null && 'category' in s && 'level' in s,
        );
        return signals.find((s) => s.category?.toLowerCase() === cat)?.level;
      }).filter(Boolean) as string[];

      if (levels.includes('high') && levels.includes('low')) {
        divergences.push(`「${cat}」风险等级存在分歧，建议进一步核实`);
      }
    }
  }

  const modelCount = valid.length;
  const synthNote = modelCount >= 2
    ? `已综合 ${modelCount} 个 AI 模型分析${divergences.length > 0 ? '，存在分歧点见下' : '，各模型结论高度一致'}`
    : '由单一模型生成';

  return {
    ...base,
    riskSignals: allSignals,
    recommendations: allRecs.slice(0, 5),
    _meta: {
      modelsUsed: modelCount,
      totalModels: results.length,
      fastestModel: primary.label,
      fastestMs: primary.ms,
      synthesisNote: synthNote,
      divergences,
    },
  };
}

// ── 主处理器 ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const body = await req.json();
    const {
      subjectName = '',
      relationship = '',
      background = '',
      assets = '',
      guestMode = false,
    } = body;

    if (!subjectName.trim()) {
      return new Response(JSON.stringify({ error: '请填写调查对象姓名' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // 非 guest 模式需验证 Auth
    if (!guestMode) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: '未登录' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response(JSON.stringify({ error: '用户未登录' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }
    }

    // 拼接全部输入文本用于语言检测
    const fullText = [subjectName, relationship, background, assets].join(' ');
    const lang = detectLanguage(fullText);
    const prompt = buildPrompt(subjectName, relationship, background, assets, lang);

    console.log(`[magic_mirror] lang=${lang}, subject="${subjectName}"`);

    // ── 按语言路由并行调用 ──────────────────────────────
    const calls: Promise<{ label: string; data: Record<string, unknown> | null; ms: number }>[] = [];

    // 英文或混合 → 加入 Groq
    if (lang === 'en' || lang === 'mixed') {
      if (GROQ_API_KEY) {
        calls.push(callModel({
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: GROQ_API_KEY,
          model: 'llama-3.3-70b-versatile',
          prompt,
          label: 'Groq-Llama3.3-70B',
        }));
      } else {
        console.warn('[magic_mirror] GROQ_API_KEY not configured, skipping Groq');
      }
    }

    // 中文、英文、混合 → 硅基流动 Qwen2.5-7B
    if (SILICONFLOW_API_KEY) {
      calls.push(callModel({
        baseUrl: 'https://api.siliconflow.cn/v1',
        apiKey: SILICONFLOW_API_KEY,
        model: 'Qwen/Qwen2.5-7B-Instruct',
        prompt,
        label: 'SiliconFlow-Qwen2.5-7B',
      }));

      // 中文、英文、混合 → 硅基流动 DeepSeek-V3
      calls.push(callModel({
        baseUrl: 'https://api.siliconflow.cn/v1',
        apiKey: SILICONFLOW_API_KEY,
        model: 'deepseek-ai/DeepSeek-V3',
        prompt,
        label: 'SiliconFlow-DeepSeek-V3',
      }));
    } else {
      console.warn('[magic_mirror] SILICONFLOW_API_KEY not configured, skipping SiliconFlow');
    }

    if (calls.length === 0) {
      return new Response(JSON.stringify({ error: 'AI 服务密钥未配置，请联系管理员' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // 取最快成功的模型结果（Promise.any），超时 25s 兜底
    const raceWithTimeout = <T,>(promises: Promise<T>[], ms: number): Promise<T> =>
      Promise.any([
        ...promises,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);

    let reportData;
    try {
      // 先等最快的一路返回
      const first = await raceWithTimeout(calls, 25000);
      reportData = synthesize([first], subjectName);
    } catch {
      // 如果 Promise.any 全部失败，尝试 allSettled 取任何成功的结果
      const settled = await Promise.allSettled(calls);
      const successes = settled
        .filter((r): r is PromiseFulfilledResult<Awaited<(typeof calls)[0]>> => r.status === 'fulfilled')
        .map((r) => r.value);
      if (successes.length === 0) throw new Error('所有 AI 模型均无响应，请稍后重试');
      reportData = synthesize(successes, subjectName);
    }

    console.log(`[magic_mirror] synthesized, modelsUsed=${(reportData._meta as Record<string, unknown>)?.modelsUsed}`);

    return new Response(JSON.stringify({ reportData, lang }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[magic_mirror ERROR]', msg);
    return new Response(JSON.stringify({ error: msg || '服务内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
});
