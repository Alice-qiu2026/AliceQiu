import { createClient } from 'npm:@supabase/supabase-js@2.47.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTEGRATIONS_API_KEY = Deno.env.get('INTEGRATIONS_API_KEY') || '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const SILICONFLOW_API_KEY = Deno.env.get('SILICONFLOW_API_KEY') || '';

const BAIDU_SEARCH_ENDPOINT = 'https://app-cc2fqeuowe81-api-DYJwo27V8Qya-gateway.appmiaoda.com/v2/ai_search/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// ── 图片OCR（使用Groq免费视觉模型）────────────────────────
async function extractTextFromImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  if (!GROQ_API_KEY) return '';
  try {
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [{
          role: 'user',
          content: [{
            type: 'image_url',
            image_url: { url: dataUrl, detail: 'high' },
          }, {
            type: 'text',
            text: '请完整提取图片中所有文字内容，包括姓名、职位、公司、电话、邮箱、网址/域名、微信号、地址等所有可见信息。只输出提取到的文字，不要解释。',
          }],
        }],
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return '';
    const d = await resp.json();
    return d.choices?.[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.error('[extractTextFromImage]', e);
    return '';
  }
}

// ── 从名片/图片文字提取结构化信息 ─────────────────────────
async function extractCardInfo(imageText: string): Promise<{
  names: string[];
  website: string;
  email: string;
  phone: string;
  company: string;
  context: string;
}> {
  const prompt = `你是一个名片信息提取AI。用户上传了一张名片或文件图片，已通过OCR提取到以下文字：

---
${imageText}
---

请严格按以下JSON格式输出（只输出JSON，禁止任何其他文字）：
{
  "names": ["姓名列表（全名优先，按相关性排序）"],
  "website": "网站域名（如有，格式如 example.com）",
  "email": "邮箱（如有）",
  "phone": "电话（如有）",
  "company": "公司名称（如有）",
  "context": "一句话描述该名片/文件的用途或背景"
}`;

  const tryModel = async (baseUrl: string, apiKey: string, model: string) => {
    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 400, temperature: 0.1 }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) return null;
      const d = await resp.json();
      const raw = d.choices?.[0]?.message?.content ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch { return null; }
  };

  if (GROQ_API_KEY) {
    const r = await tryModel('https://api.groq.com/openai/v1', GROQ_API_KEY, 'llama-3.3-70b-versatile');
    if (r) return r;
  }
  if (SILICONFLOW_API_KEY) {
    const r = await tryModel('https://api.siliconflow.cn/v1', SILICONFLOW_API_KEY, 'deepseek-ai/DeepSeek-V3');
    if (r) return r;
  }
  return { names: [], website: '', email: '', phone: '', company: '', context: '' };
}

// ── 构建优先级搜索任务队列 ─────────────────────────────────
function buildPrioritySearchTasks(
  subjectName: string,
  cardInfo: { names: string[]; website: string; email: string; company: string; context: string },
  pdfEntities: { names: string[]; locations: string[]; context: string }
): { query: string; reason: string }[] {
  const tasks: { query: string; reason: string }[] = [];

  // 最高优先：如果有名片提取的网站，先验证官网
  if (cardInfo.website) {
    tasks.push({ query: `site:${cardInfo.website.replace(/^https?:\/\//, '')} "${cardInfo.names[0] || subjectName}"`, reason: '官网验证' });
    tasks.push({ query: `"${cardInfo.email}"`, reason: '邮箱+官网一致性验证' });
  }

  // 高优先：名片提取的姓名+公司精准搜索
  if (cardInfo.names.length > 0) {
    if (cardInfo.company) {
      tasks.push({ query: `"${cardInfo.names[0]}" "${cardInfo.company}"`, reason: '姓名+公司精准验证' });
    }
    if (cardInfo.email) {
      tasks.push({ query: `"${cardInfo.email}"`, reason: '邮箱搜索' });
    }
  }

  // 中优先：PDF提取的实体（人名+地点）
  if (pdfEntities.names.length > 0) {
    const primaryName = pdfEntities.names[0];
    const loc = pdfEntities.locations[0] || '';
    tasks.push({ query: `"${primaryName}" ${loc}`, reason: 'PDF人名+地点搜索' });
  }

  // 默认：被查人姓名全名搜索
  tasks.push({ query: `"${subjectName}" 个人信息 背景 履历`, reason: '被查人姓名基础搜索' });

  return tasks;
}

const SEARCH_PLATFORMS = [
  { id: 'google', name: 'Google 搜索', query: (n: string) => `"${n}" background profile news` },
  { id: 'news_cn', name: '新闻媒体（中文）', query: (n: string) => `"${n}" 新华网 OR 人民网 OR 央视网 OR 新浪新闻` },
  { id: 'news_en', name: '新闻媒体（英文）', query: (n: string) => `"${n}" CBC OR "Global News" OR CTV site:cbc.ca OR site:globalnews.ca` },
  { id: 'wechat', name: '微信公众号', query: (n: string) => `"${n}" 公众号 文章` },
  { id: 'xiaohongshu', name: '小红书', query: (n: string) => `"${n}" site:xiaohongshu.com` },
  { id: 'douyin', name: '抖音/TikTok', query: (n: string) => `"${n}" 抖音 OR tiktok` },
  { id: 'github', name: 'GitHub（技术背景）', query: (n: string) => `"${n}" site:github.com` },
];
// ── SSE 辅助 ──────────────────────────────────────────────
function makeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ── 百度AI搜索（SSE → 累积 content + references）────────
async function baiduSearch(query: string, topK = 5): Promise<{
  content: string;
  refs: { title: string; url: string; snippet: string }[];
}> {
  if (!INTEGRATIONS_API_KEY) return { content: '', refs: [] };
  try {
    const resp = await fetch(BAIDU_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Authorization': `Bearer ${INTEGRATIONS_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }],
        resource_type_filter: [{ type: 'web', top_k: topK }],
        enable_reasoning: false,
        enable_deep_search: false,
        max_completion_tokens: 600,
      }),
    });
    if (!resp.ok || !resp.body) return { content: '', refs: [] };
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf8');
    let buf = '';
    let fullContent = '';
    let refs: { title: string; url: string; snippet: string }[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          fullContent += parsed.choices?.[0]?.delta?.content ?? '';
          if (parsed.references?.length) {
            refs = parsed.references.map((r: { title: string; url: string; content?: string }) => ({
              title: r.title || '（无标题）',
              url: r.url || '',
              snippet: (r.content || '').slice(0, 200),
            }));
          }
        } catch { /* skip malformed */ }
      }
    }
    return { content: fullContent, refs };
  } catch (e) {
    console.error('[baiduSearch error]', e);
    return { content: '', refs: [] };
  }
}

// ── 服务端 PDF 文字提取（支持literal+hex双编码）───────────
function extractPdfText(base64Content: string): string {
  try {
    const binaryStr = atob(base64Content);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    let raw = '';
    try { raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes); } catch { raw = ''; }
    if (!raw) { raw = new TextDecoder('latin1').decode(bytes); }
    const btEtTexts: string[] = [];
    const btEtRegex = /BT([\s\S]{1,3000}?)ET/g;
    let m: RegExpExecArray | null;
    while ((m = btEtRegex.exec(raw)) !== null) {
      const block = m[1];
      const literalMatches = block.match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g) || [];
      const hexMatches = block.match(/<([0-9A-Fa-f\s]+)>/g) || [];
      const allParts: string[] = [];
      for (const s of literalMatches) {
        const inner = s.slice(1, -1);
        const decoded = inner
          .replace(/\\n/g, '\n').replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\').replace(/\\([()\\])/g, '$1')
          .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
          .replace(/\\x([0-9A-Fa-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        const trimmed = decoded.trim();
        if (trimmed.length > 0) allParts.push(trimmed);
      }
      for (const s of hexMatches) {
        const hex = s.slice(1, -1).replace(/\s/g, '');
        if (hex.length < 2) continue;
        try {
          let ascii = '';
          for (let i = 0; i < hex.length - 1; i += 2) {
            const code = parseInt(hex.slice(i, i + 2), 16);
            if ((code >= 32 && code <= 126) || code >= 128) ascii += String.fromCharCode(code);
            else if (code === 10 || code === 13) ascii += ' ';
          }
          const trimmed = ascii.trim();
          if (trimmed.length > 0) allParts.push(trimmed);
        } catch { /* skip */ }
      }
      if (allParts.length > 0) btEtTexts.push(allParts.join(' '));
    }
    if (btEtTexts.length > 0) return btEtTexts.join('\n').slice(0, 8000);
    const fallbackLiteral = raw.match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g) || [];
    const literalText = fallbackLiteral
      .map(s => { const inner = s.slice(1, -1).replace(/\\./g, (m2) => m2 === '\\(' ? '(' : m2 === '\\)' ? ')' : m2.slice(1)); return inner; })
      .filter(t => t.trim().length > 0 && /[\u4e00-\u9fff\w]/.test(t))
      .join(' ').slice(0, 5000);
    if (literalText) return literalText;
    const fallbackHex = raw.match(/<([0-9A-Fa-f]{4,})>/g) || [];
    const hexParts: string[] = [];
    for (const s of fallbackHex) {
      const hex = s.slice(1, -1).replace(/\s/g, '');
      try {
        let ascii = '';
        for (let i = 0; i < hex.length - 1; i += 2) {
          const code = parseInt(hex.slice(i, i + 2), 16);
          if ((code >= 32 && code <= 126) || code >= 128) ascii += String.fromCharCode(code);
          else if (code === 10 || code === 13) ascii += ' ';
        }
        const t = ascii.trim();
        if (t.length > 0) hexParts.push(t);
      } catch { /* skip */ }
    }
    return hexParts.join(' ').slice(0, 5000) || literalText;
  } catch (e) {
    console.error('[extractPdfText error]', e);
    return '';
  }
}

// ── 从PDF提取搜索关键词（人名/地名/公司名）────────────────
async function extractSearchKeywordsFromPdf(rawText: string): Promise<{
  names: string[];
  locations: string[];
  context: string;
}> {
  if (!rawText || rawText.trim().length < 30) {
    return { names: [], locations: [], context: '' };
  }
  const prompt = `从以下PDF提取的文字内容中，识别出与背景调查最相关的实体信息。
请提取：1）所有真实人名（全名>拼音>部分名），2）地点（城市/国家），3）与"关系"相关的信息。
如果提取不到有意义的实体，返回空列表。
格式（严格JSON，禁止任何其他文字）：
{
  "names": ["可搜索的真实姓名列表，按相关性排序"],
  "locations": ["地点列表"],
  "context": "一句话描述该文件的背景（如：加拿大团聚移民申请人）"
}
PDF内容：
${rawText.slice(0, 4000)}`;

  const tryModel = async (baseUrl: string, apiKey: string, model: string): Promise<{
    names: string[];
    locations: string[];
    context: string;
  } | null> => {
    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 400, temperature: 0.1 }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) return null;
      const d = await resp.json();
      const raw = d.choices?.[0]?.message?.content ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch { return null; }
  };

  if (SILICONFLOW_API_KEY) {
    const r = await tryModel('https://api.siliconflow.cn/v1', SILICONFLOW_API_KEY, 'deepseek-ai/DeepSeek-V3');
    if (r) return r;
  }
  if (GROQ_API_KEY) {
    const r = await tryModel('https://api.groq.com/openai/v1', GROQ_API_KEY, 'llama-3.3-70b-versatile');
    if (r) return r;
  }
  return { names: [], locations: [], context: '' };
}

// ── 构建精准搜索关键词（基于PDF提取的实体）─────────────────
function buildEnhancedQuery(baseQuery: string, extracted: {
  names: string[];
  locations: string[];
  context: string;
}): string {
  if (extracted.names.length === 0 && extracted.locations.length === 0) {
    return baseQuery;
  }
  const parts: string[] = [];
  if (extracted.names.length > 0) parts.push(`"${extracted.names[0]}"`);
  if (extracted.locations.length > 0) parts.push(extracted.locations[0]);
  if (extracted.context) {
    const keywords = extracted.context
      .replace(/[，。、]/g, ' ').split(' ')
      .filter(w => w.length >= 2 && w.length <= 10).slice(0, 3);
    parts.push(...keywords);
  }
  return parts.join(' ');
}

// ── 用 AI 总结 PDF 内容（200字以内）──────────────────────
async function summarizePdfWithAI(fileName: string, rawText: string): Promise<string> {
  if (!rawText || rawText.trim().length < 20) {
    return '该文件为扫描件或加密PDF，无法自动提取文字内容，建议人工阅读后补充关键信息。';
  }
  const prompt = `以下是一份名为「${fileName}」的PDF文件中提取的文字内容。请用不超过200字的中文，简要描述该文件的核心内容要点（包括：文件类型、涉及人物、主要事实、关键日期或金额等）。只输出描述文字，不要任何前缀。

文件内容：
${rawText.slice(0, 3000)}`;

  const tryModel = async (baseUrl: string, apiKey: string, model: string): Promise<string | null> => {
    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 400, temperature: 0.3 }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) return null;
      const d = await resp.json();
      return d.choices?.[0]?.message?.content?.trim() || null;
    } catch { return null; }
  };

  if (SILICONFLOW_API_KEY) {
    const r = await tryModel('https://api.siliconflow.cn/v1', SILICONFLOW_API_KEY, 'Qwen/Qwen2.5-7B-Instruct');
    if (r) return r;
  }
  if (GROQ_API_KEY) {
    const r = await tryModel('https://api.groq.com/openai/v1', GROQ_API_KEY, 'llama-3.3-70b-versatile');
    if (r) return r;
  }
  return `（AI摘要不可用）文件原始内容摘录：${rawText.slice(0, 200)}…`;
}

// ── AI 报告生成（Groq / SiliconFlow）──────────────────────
async function callModel(baseUrl: string, apiKey: string, model: string, prompt: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2500, temperature: 0.2 }),
      signal: AbortSignal.timeout(40000),
    });
    if (!resp.ok) { console.error(`[callModel] ${model} HTTP ${resp.status}`); return null; }
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { console.error(`[callModel] ${model} no JSON in response`, raw.slice(0, 200)); return null; }
    return JSON.parse(jsonMatch[0]);
  } catch (e) { console.error(`[callModel] ${model} error:`, e); return null; }
}

// ── 主处理器 ──────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const body = await req.json();
    const {
      subjectName,
      relationship,
      background,
      assets,
      pdfFiles = [],
      pdfText = '',
      guestMode = false,
      // 【新增】图片字段（前端上传名片时传入）
      imageFile = null as { base64?: string; mimeType?: string } | null,
    } = body;

    if (!subjectName?.trim()) {
      return new Response(JSON.stringify({ error: '请输入被查人姓名' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // 身份验证（非游客模式）
    if (!guestMode) {
      const authHeader = req.headers.get('authorization') || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response(JSON.stringify({ error: '用户未登录' }), {
          status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const enc = new TextEncoder();
    const send = async (event: string, data: unknown) => {
      await writer.write(enc.encode(makeSSE(event, data)));
    };

    (async () => {
      try {
        // ━━ 第零步：图片OCR + 名片信息提取（优先级最高）━━━━━━━━━
        let cardInfo = { names: [] as string[], website: '', email: '', phone: '', company: '', context: '' };
        let imageText = '';

        if (imageFile?.base64) {
          await send('progress', { id: 'card', name: '名片/图片内容识别', status: 'searching' });
          imageText = await extractTextFromImage(imageFile.base64, imageFile.mimeType || 'image/jpeg');
          if (imageText) {
            cardInfo = await extractCardInfo(imageText);
          }
          await send('progress', {
            id: 'card',
            name: '名片/图片内容识别',
            status: 'completed',
            count: cardInfo.names.length > 0 || cardInfo.website ? 1 : 0,
          });
        }

        // ━━ 第一步：解析上传文件 ━━━━━━━━━━━━━━━━━━━━━━━━
        interface UploadedFileResult {
          name: string;
          summary: string;
          extracted: boolean;
          rawText: string;
        }
        const uploadedFiles: UploadedFileResult[] = [];

        if (pdfText?.trim()) {
          await send('progress', { id: 'pdf', name: '上传文件分析', status: 'searching' });
          const summary = await summarizePdfWithAI('用户上传文件', pdfText);
          const fileBlocks = pdfText.split(/^\[.+\]$/m).filter(s => s.trim());
          if (fileBlocks.length > 0) {
            for (let i = 0; i < fileBlocks.length && i < 5; i++) {
              const block = fileBlocks[i].trim();
              const blockSummary = await summarizePdfWithAI(`文件${i + 1}`, block);
              uploadedFiles.push({ name: `文件${i + 1}`, summary: blockSummary, extracted: block.length > 20, rawText: block });
            }
          } else {
            uploadedFiles.push({ name: '上传文件', summary, extracted: true, rawText: pdfText });
          }
          await send('progress', { id: 'pdf', name: '上传文件分析', status: 'completed', count: uploadedFiles.length });
        } else if (Array.isArray(pdfFiles) && pdfFiles.length > 0) {
          await send('progress', { id: 'pdf', name: '上传文件分析', status: 'searching' });
          for (const file of pdfFiles.slice(0, 5)) {
            const rawText = extractPdfText(file.base64 || '');
            const summary = await summarizePdfWithAI(file.name, rawText);
            uploadedFiles.push({ name: file.name, summary, extracted: rawText.length > 20, rawText });
          }
          await send('progress', { id: 'pdf', name: '上传文件分析', status: 'completed', count: uploadedFiles.length });
        } else {
          await send('progress', { id: 'pdf', name: '上传文件分析', status: 'completed', count: 0 });
        }

        // PDF实体提取（合并所有文件的实体用于精准搜索）
        let pdfEntities = { names: [] as string[], locations: [] as string[], context: '' };
        if (uploadedFiles.length > 0) {
          const combinedText = uploadedFiles.map(f => f.rawText).join('\n');
          pdfEntities = await extractSearchKeywordsFromPdf(combinedText);
        }

        // ━━ 第二步：构建优先级搜索任务队列 ━━━━━━━━━━━━━━━
        // 【核心优化】优先使用名片信息构建精准搜索词
        const priorityTasks = buildPrioritySearchTasks(subjectName, cardInfo, pdfEntities);

        // ━━ 第三步：各平台搜索（顺序执行）━━━━━━━━━━━━━━━━━━
        interface PlatformSearchResult {
          id: string;
          name: string;
          query: string;
          status: 'completed' | 'no_results' | 'limited' | 'failed';
          findings: { title: string; url: string; snippet: string }[];
          aiSummary: string;
          reason?: string; // 任务来源说明
        }
        const searchResults: PlatformSearchResult[] = [];

        // 先处理优先级任务（精准搜索）
        for (let i = 0; i < priorityTasks.length; i++) {
          const task = priorityTasks[i];
          await send('progress', { id: `priority_${i}`, name: `精准搜索：${task.reason}`, status: 'searching' });
          const result = await baiduSearch(task.query, 5);
          const hasResults = result.refs.length > 0;
          searchResults.push({
            id: `priority_${i}`,
            name: `精准搜索（${task.reason}）`,
            query: task.query,
            status: hasResults ? 'completed' : 'no_results',
            findings: result.refs.slice(0, 5),
            aiSummary: result.content.slice(0, 400),
            reason: task.reason,
          });
          await send('progress', { id: `priority_${i}`, name: `精准搜索：${task.reason}`, status: 'completed', count: result.refs.length });
          await new Promise(r => setTimeout(r, 300));
        }

        // 再执行通用平台搜索（兜底）
        for (const platform of SEARCH_PLATFORMS) {
          const baseQuery = platform.query(subjectName);
          const query = buildEnhancedQuery(baseQuery, pdfEntities);
          await send('progress', { id: platform.id, name: platform.name, status: 'searching' });
          const result = await baiduSearch(query, 5);
          const hasResults = result.refs.length > 0;
          const platformResult: PlatformSearchResult = {
            id: platform.id,
            name: platform.name,
            query,
            status: hasResults ? 'completed' : 'no_results',
            findings: result.refs.slice(0, 5),
            aiSummary: result.content.slice(0, 400),
          };
          searchResults.push(platformResult);
          await send('progress', { id: platform.id, name: platform.name, status: hasResults ? 'completed' : 'completed', count: result.refs.length });
          await new Promise(r => setTimeout(r, 300));
        }

        // 标记需人工核实的平台（诚实标注，不虚假勾选）
        for (const p of LIMITED_PLATFORMS) {
          await send('progress', { id: p.id, name: p.name, status: 'limited', count: 0 });
          searchResults.push({
            id: p.id,
            name: p.name,
            query: '（需人工核实）',
            status: 'limited',
            findings: [],
            aiSummary: p.note,
          });
        }

        await send('searching_done', { message: '搜索完成，正在分析生成报告…' });

        // ━━ 第四步：构建基于真实数据的AI提示词 ━━━━━━━━━━
        const cardSection = imageText
          ? `【第零步：名片/图片识别结果】（优先级最高）\nOCR提取文字：${imageText.slice(0, 300)}\n结构化提取：姓名=${cardInfo.names.join(', ') || '未识别出'}，网站=${cardInfo.website || '无'}，邮箱=${cardInfo.email || '无'}，公司=${cardInfo.company || '无'}，背景=${cardInfo.context || '无'}\n`
          : '【第零步：名片/图片识别结果】\n用户未上传图片文件\n';

        const filesSection = uploadedFiles.length > 0
          ? `【第一步：上传文件分析结果】\n共上传 ${uploadedFiles.length} 个文件：\n`
            + uploadedFiles.map((f, i) =>
              `${i + 1}. 文件名：${f.name}\n  提取状态：${f.extracted ? '成功' : '扫描件/加密，文字提取失败'}\n  内容摘要：${f.summary}`
            ).join('\n')
          : '【第一步：上传文件分析结果】\n用户未上传任何文件';

        const searchSection = `【第二步：各平台实际搜索结果】\n`
          + searchResults.map(r => {
            if (r.status === 'limited') return `▫ ${r.name}：${r.aiSummary}（未查询）`;
            if (r.findings.length === 0) return `▫ ${r.name}（${r.query}）：未查到公开记录`;
            const items = r.findings.slice(0, 3).map((f, i) => `  ${i + 1}. 【${f.title}】${f.snippet.slice(0, 100)}`).join('\n');
            return `▫ ${r.name}（${r.query}）：找到 ${r.findings.length} 条结果\n${items}`;
          }).join('\n\n');

        const prompt = buildReportPrompt(subjectName, relationship, background, assets, cardSection, filesSection, searchSection);

        // ━━ 第五步：AI生成报告 ━━━━━━━━━━━━━━━━━━━━━━━━━
        let reportData: Record<string, unknown> | null = null;
        const aiCalls: Promise<Record<string, unknown> | null>[] = [];
        if (SILICONFLOW_API_KEY) {
          aiCalls.push(callModel('https://api.siliconflow.cn/v1', SILICONFLOW_API_KEY, 'deepseek-ai/DeepSeek-V3', prompt));
          aiCalls.push(callModel('https://api.siliconflow.cn/v1', SILICONFLOW_API_KEY, 'Qwen/Qwen2.5-7B-Instruct', prompt));
        }
        if (GROQ_API_KEY) {
          aiCalls.push(callModel('https://api.groq.com/openai/v1', GROQ_API_KEY, 'llama-3.3-70b-versatile', prompt));
        }
        if (aiCalls.length > 0) {
          try {
            const result = await Promise.any(aiCalls);
            if (result) reportData = result;
          } catch {
            const settled = await Promise.allSettled(aiCalls);
            for (const r of settled) {
              if (r.status === 'fulfilled' && r.value) { reportData = r.value; break; }
            }
          }
        }
        if (!reportData) {
          reportData = generateFallbackReport(subjectName, searchResults);
        }
        (reportData as Record<string, unknown>).uploadedFiles = uploadedFiles.map(f => ({
          name: f.name,
          summary: f.summary,
          extracted: f.extracted,
        }));
        (reportData as Record<string, unknown>).searchResults = searchResults.map(r => ({
          id: r.id,
          name: r.name,
          query: r.query,
          status: r.status,
          findings: r.findings,
        }));
        // 【新增】将名片识别结果注入报告
        (reportData as Record<string, unknown>).cardInfo = {
          imageText,
          ...cardInfo,
        };
        await send('report_ready', { reportData });

      } catch (err) {
        console.error('[magic_mirror_v2 stream error]', err);
        await send('error', { message: err instanceof Error ? err.message : '生成失败，请重试' });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', ...CORS },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
});

// ── 报告提示词（严格基于实际数据）─────────────────────────
function buildReportPrompt(
  name: string,
  relationship: string,
  background: string,
  assets: string,
  cardSection: string,
  filesSection: string,
  searchSection: string,
): string {
  return `你是「魔镜」——跨境家庭关系风险筛查 AI。请严格基于下方提供的真实搜索数据和文件分析结果进行风险评估。

⚠️ 严格规则：
1. 只能引用下方"实际搜索结果"中出现的信息，不得凭空捏造任何事实
2. 如果某平台未查到记录，请明确写"未查到公开记录"，不得虚构
3. 风险信号的 description 必须注明信息来源（例如：来自百度搜索、来自上传文件）
4. 若所有平台均无结果，整体评级应为"⚪ 白灯 - 信息不足"
5. 【重点】名片/图片识别的信息（网站、邮箱）具有最高优先级，应作为验证基础

【被查人姓名】：${name}
【关系类型】：${relationship || '未指定'}
【用户背景描述】：${background || '无'}
【资产/财务信息】：${assets || '无'}

${cardSection}
${filesSection}
${searchSection}

【风险等级规则】
- high（红灯）：发现法院执行记录、未结刑事案件、企业被吊销、身份严重不符
- medium（黄灯）：信息有部分不一致、历史纠纷、声明资产无佐证、缺失信息超3项
- low（绿灯）：多平台信息吻合，无负面记录
- unknown（白灯）：所有平台均无记录，无法判断

请严格按以下 JSON 格式输出（禁止任何前缀文字或 markdown）：
{
  "identityVerification": {
    "name": "${name}",
    "age": "<仅凭已找到的信息填写，否则填'暂无公开数据'>",
    "occupation": "<仅凭已找到的信息填写，否则填'暂无公开数据'>",
    "location": "<仅凭已找到的信息填写，否则填'暂无公开数据'>",
    "nationality": "<仅凭已找到的信息填写，否则填'暂无公开数据'>",
    "website": "<名片/图片中识别的网站域名>",
    "email": "<名片/图片中识别的邮箱>"
  },
  "riskSignals": [
    {
      "category": "<风险类别>",
      "level": "",
      "description": "<具体描述，须注明信息来源>"
    }
  ],
  "overallRating": "<🔴 红灯 - 高风险|🟡 黄灯 - 需关注|🟢 绿灯 - 低风险|⚪ 白灯 - 信息不足>",
  "recommendations": ["<基于实际发现的具体建议>"],
  "actionChecklist": {
    "online": ["<线上核查项>"],
    "proactive": ["<主动核实项>"],
    "onsite": ["<现场核查项>"]
  }
}`;
}

// ── 降级报告 ──────────────────────────────────────────────
function generateFallbackReport(
  name: string,
  searchResults: { status: string }[],
): Record<string, unknown> {
  const hasData = searchResults.some(r => r.status === 'completed');
  return {
    identityVerification: {
      name,
      age: '暂无公开数据',
      occupation: '暂无公开数据',
      location: '暂无公开数据',
      nationality: '暂无公开数据',
    },
    riskSignals: [{
      category: '身份核实',
      level: hasData ? 'medium' : 'unknown',
      description: hasData
        ? '多平台搜索到部分相关信息，但AI分析暂时不可用，建议人工复核'
        : '所有可查平台均未找到此人的公开信息记录',
    }],
    overallRating: hasData ? '🟡 黄灯 - 需关注' : '⚪ 白灯 - 信息不足',
    recommendations: [
      '建议通过持牌律师进行进一步身份核实',
      '可自行登录天眼查、裁判文书网等平台手动核查',
      '补充提供更多相关文件以提高分析准确性',
    ],
    actionChecklist: {
      online: ['自行搜索社交媒体账号', '查询公开法院记录', '核实企业注册信息'],
      proactive: ['请求提供政府签发证件原件', '联系已知共同联系人核实'],
      onsite: ['安排当面会谈核实身份', '实地查验相关资产'],
    },
  };
}