import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bot, Shield, AlertCircle, CheckCircle2, XCircle, X, Plus, Search, Sparkles, CreditCard, QrCode, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { createReport } from '@/services/api';
import { supabase } from '@/db/supabase';
import type { ReportData } from '../types';
import { useTranslation } from 'react-i18next';

const statusLabel: Record<string, string> = {
  pending: '等待中',
  searching: '搜索中',
  completed: '完成',
  no_results: '无结果',
  limited: '需人工',
  failed: '失败',
};

function PlatformIcon({ status }: { status: string }) {
  const cls = status === 'completed' ? 'text-green-500' : status === 'failed' || status === 'no_results' ? 'text-gray-400' : 'text-yellow-500';
  if (status === 'completed') return <CheckCircle2 className={`w-4 h-4 ${cls}`} />;
  if (status === 'failed' || status === 'no_results') return <XCircle className={`w-4 h-4 ${cls}`} />;
  return <Search className={`w-4 h-4 animate-pulse ${cls}`} />;
}

const PLATFORMS = [
  { id: 'baidu', name: '百度搜索', flag: '🔍' },
  { id: 'google', name: 'Google', flag: '🔍' },
  { id: 'weibo', name: '微博', flag: '📣' },
  { id: 'zhihu', name: '知乎', flag: '💬' },
  [
    { id: 'wechat', name: '微信公众号', flag: '💬' },
    { id: 'toutiao', name: '今日头条', flag: '📰' },
    { id: 'douyin', name: '抖音/TikTok', flag: '🎵' },
    { id: 'bilibili', name: 'B站', flag: '📺' },
    { id: 'xiaohongshu', name: '小红书', flag: '📕' },
    { id: 'news', name: '新闻/年鉴', flag: '📡' },
    { id: 'github', name: 'GitHub', flag: '🐙' },
    { id: 'pdf', name: '能查的都在', flag: '📄' },
    { id: 'tianyanchu', name: '天眼查', flag: '🔎', limited: true },
    { id: 'court', name: '裁判文书', flag: '⚖️', limited: true },
    { id: 'linkedin', name: 'LinkedIn', flag: '💼', limited: true },
  ].flat(),
];

// ── PDF文字提取（pdfjs-dist + ocr.space）───────────────────
function extractTextFromPdf(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target!.result as ArrayBuffer);
        let pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib;
        if (!pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          document.head.appendChild(script);
          await new Promise(r => script.onload = r);
          pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib;
        }
        (window as unknown as Record<string, unknown>).pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await (window as unknown as Record<string, unknown>).pdfjsLib.getDocument(typedArray).promise;
        const textParts: string[] = [];
        const maxPages = Math.min(pdf.numPages, 10);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textParts.push(content.items.map((item: { str?: string }) => item.str || '').join(' '));
        }
        resolve(textParts.join('\n'));
      } catch {
        resolve('');
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsArrayBuffer(file);
  });
}

async function ocrPdfWithCanvas(file: File, onProgress: (p: string) => void): Promise<string> {
  onProgress('正在加载PDF解析器…');
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const binaryStr = Array.from(uint8).map(b => String.fromCharCode(b)).join('');
  const base64 = btoa(binaryStr);
  let pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib;
  if (!pdfjsLib) {
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => resolve();
      document.head.appendChild(s);
    });
    pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib;
  }
  (window as unknown as Record<string, unknown>).pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await (window as unknown as Record<string, unknown>).pdfjsLib.getDocument({ data: uint8 }).promise;
  const texts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 10);
  for (let p = 1; p <= maxPages; p++) {
    onProgress(`正在识别第 ${p}/${maxPages} 页…`);
    const page = await pdf.getPage(p);
    const scale = 3;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    try {
      const fd = new FormData();
      fd.append('base64Image', `data:image/jpeg;base64,${dataUrl}`);
      fd.append('language', 'chi_sim+eng');
      fd.append('isOverlayRequired', 'false');
      fd.append('scale', 'true');
      fd.append('detectOrientation', 'true');
      fd.append('filetype', 'JPEG');
      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { apikey: 'K87958853888957' },
        body: fd,
      });
      const d = await res.json();
      if (d.ParsedResults?.[0]?.ParsedText) {
        texts.push(d.ParsedResults[0].ParsedText);
      }
    } catch (err) {
      console.warn('OCR error', err);
    }
  }
  return texts.join('\n');
}

async function processPDFFile(file: File, onStatus?: (s: string) => void): Promise<{ name: string; text: string; isScanned: boolean; pages: number }> {
  const MB = file.size / 1024 / 1024;
  if (MB > 5) { onStatus?.(`文件 ${file.name} 超过5MB，跳过`); return { name: file.name, text: '', isScanned: false, pages: 0 }; }
  onStatus?.(`正在处理 ${file.name}…`);
  const text = await extractTextFromPdf(file);
  if (text.trim().length > 50) {
    onStatus?.(`${file.name} 提取完成`);
    return { name: file.name, text, isScanned: false, pages: 0 };
  }
  onStatus?.(`${file.name} 疑似扫描件，转OCR…`);
  const ocrText = await ocrPdfWithCanvas(file, (p) => onStatus?.(p));
  return { name: file.name, text: ocrText, isScanned: true, pages: 0 };
}

async function processAllPDFFiles(files: File[], onFileStatus?: (name: string, status: string) => void) {
  const results: { name: string; text: string; isScanned: boolean; pages: number }[] = [];
  for (const file of files) {
    const result = await processPDFFile(file, (s) => onFileStatus?.(file.name, s));
    results.push(result);
  }
  const totalText = results.map(r => `[${r.name}]\n${r.text}`).join('\n');
  return { results, totalText };
}

// ── 主页面组件 ────────────────────────────────────────────
export default function MagicMirrorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showPaywall, setShowPaywall] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const guestUsed = localStorage.getItem('guest_used') || '0';
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regName_, setRegName_] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [registering, setRegistering] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [background, setBackground] = useState('');
  const [assets, setAssets] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] = useState<'searching' | 'analyzing'>('searching');
  const [platformStates, setPlatformStates] = useState<Record<string, { status: string; count: number }>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [pastedImages, setPastedImages] = useState<File[]>([]); // 粘贴的图片
  const [pdfStatus, setPdfStatus] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pastedImageInputRef = useRef<HTMLInputElement>(null);

  // ── 粘贴图片事件监听 ─────────────────────────────────────
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const fileName = `粘贴图片_${Date.now()}.${item.type.split('/')[1]}`;
          const renamedFile = new File([file], fileName, { type: item.type });
          setPastedImages(prev => {
            if (prev.length >= 5) { toast.warning('最多粘贴5张图片'); return prev; }
            return [...prev, renamedFile];
          });
          toast.success('图片已粘贴，可点击预览或提交');
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
    if (!dropped.length) { toast.error('目前仅支持 PDF 或图片文件'); return; }
    setFiles(prev => {
      const next = [...prev, ...dropped].slice(0, 5);
      return next;
    });
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
    if (!selected.length) return;
    setFiles(prev => {
      const next = [...prev, ...selected].slice(0, 5);
      return next;
    });
    e.target.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removePastedImage = useCallback((index: number) => {
    setPastedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetPlatforms = useCallback(() => {
    const init: Record<string, { status: string; count: number }> = {};
    for (const p of PLATFORMS) init[p.id] = { status: 'pending', count: 0 };
    setPlatformStates(init);
  }, []);

  const updatePlatform = useCallback((id: string, patch: Partial<{ status: string; count: number }>) => {
    setPlatformStates(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const runMirrorV2 = async (guestMode: boolean, pdfText?: string, imageFiles?: File[]): Promise<ReportData | null> => {
    resetPlatforms();
    setGeneratingPhase('searching');
    const pdfFiles: { name: string; base64: string }[] = [];
    for (const file of files) {
      if (file.size < 500_000) {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), ''));
        pdfFiles.push({ name: file.name, base64 });
      }
    }
    const abort = new AbortController();
    abortRef.current = abort;
    let session = null;
try {
  session = (await supabase.auth.getSession()).data.session;
} catch {
  // ignore auth errors
}
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const fnUrl = `${SUPABASE_URL}/functions/v1/magic_mirror_v2`;
    const body: Record<string, unknown> = {
      subjectName, relationship, background, assets,
      pdfFiles: pdfFiles.length ? pdfFiles : undefined,
      pdfText: pdfText || undefined,
      guestMode,
      // 【新增】传递粘贴的图片
      imageFile: imageFiles && imageFiles.length > 0 ? {
        base64: await blobToBase64(imageFiles[0]),
        mimeType: imageFiles[0].type,
      } : undefined,
    };
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: abort.signal,
    });
    if (!res.ok || !res.body) throw new Error(`${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let reportData: ReportData | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const chunks = buf.split('\n\n');
      buf = chunks.pop() ?? '';
      for (const raw of chunks) {
        const lines = raw.split('\n');
        let eventName = '', dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) eventName = line.slice(7).trim();
          if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (eventName === 'progress' && dataStr) {
          const d = JSON.parse(dataStr);
          updatePlatform(d.id, { status: d.status === 'completed' ? 'completed' : 'searching', count: d.count ?? 0 });
        }
        if (eventName === 'searching_done' && dataStr) {
          setGeneratingPhase('analyzing');
        }
        if (eventName === 'report_ready' && dataStr) {
          const d = JSON.parse(dataStr);
reportData = d.reportData as ReportData;
          reportData.riskLevel = reportData.riskSignals?.[0]?.level || 'unknown';
        }
        if (eventName === 'error' && dataStr) {
          const d = JSON.parse(dataStr);
          throw new Error(d.message || '生成失败');
        }
      }
    }
    return reportData;
  };

  const doGenerate = async () => {
    setGenerating(true);
    setPdfStatus('');
    try {
      let pdfText = '';
      if (files.length) {
        setPdfStatus('正在处理上传文件…');
        const { totalText } = await processAllPDFFiles(files, (name, s) => setPdfStatus(`${name}: ${s}`));
        pdfText = totalText;
      }
      const guestMode = !user;
      const reportData = await runMirrorV2(guestMode, pdfText, pastedImages);
      if (!reportData) { toast.error('生成失败，请重试'); return; }
      const riskLevel = reportData.riskSignals?.[0]?.level;
      const key = riskLevel === 'high' ? 'paywall.riskDetected' : 'paywall.generated';
      const report = await createReport({
        subject_name: subjectName,
        relationship,
        background,
        assets,
        pdf_text: pdfText,
        report_data: reportData,
      });
      if (report) {
        localStorage.setItem('report_data', JSON.stringify(reportData));
        localStorage.setItem('report_id', String(report.id));
        if (!user) {
          const used = parseInt(guestUsed || '0') + 1;
          localStorage.setItem('guest_used', String(used));
        }
        toast.success('报告生成成功！');
        navigate('/report');
      } else {
        setShowPaywall(true);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error((err as Error).message || '生成失败');
    } finally {
      setGenerating(false);
      setGeneratingPhase('searching');
      setPdfStatus('');
    }
  };

  const handleRegister = async () => {
    if (!regName_ || !regEmail || !regPassword) { toast.error('请填写必填项'); return; }
    setRegistering(true);
    const { error } = await supabase.auth.signUp({ email: regEmail, password: regPassword });
    setRegistering(false);
    if (error) toast.error(error.message || '注册失败');
    else { toast.success('注册成功，请登录'); setShowAuth(false); }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { toast.error('请填写必填项'); return; }
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoggingIn(false);
    if (error) toast.error(error.message || '登录失败');
    else { toast.success('登录成功'); setShowAuth(false); setTimeout(() => doGenerate(), 500); }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) { toast.error('请输入邮箱'); return; }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    setResetting(false);
    if (error) toast.error(error.message || '发送失败');
    else setResetSent(true);
  };

  const handlePayment = async () => {
    setCreatingOrder(true);
    try {
      if (payMethod === 'wechat') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/create_wechat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: localStorage.getItem('report_id'), }),
        }).then(r => r.json());
        if (res.pay_url) window.location.href = res.pay_url;
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/create_alipay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: localStorage.getItem('report_id'), }),
        }).then(r => r.json());
        if (res.pay_url) window.location.href = res.pay_url;
      }
    } catch (err) {
      toast.error('支付创建失败');
    } finally {
      setCreatingOrder(false);
    }
  };

  const canGenerate = subjectName.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">魔镜 · 照妖镜</h1>
          </div>
          <p className="text-slate-500 text-sm">跨境家庭 · 关系风险初筛 · 3分钟获取报告</p>
        </div>

        {/* 主卡片 */}
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* 被查人信息 */}
            <div className="space-y-2">
              <Label>被查人姓名 *</Label>
              <Input placeholder="请输入被查人姓名（必填）" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="text-base" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>与您的关系</Label>
                <Input placeholder="如：配偶、合伙人" value={relationship} onChange={e => setRelationship(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>其他背景（选填）</Label>
              <Textarea placeholder="补充任何有助于筛查的背景信息…" value={background} onChange={e => setBackground(e.target.value)} rows={3} />
            </div>

            {/* 上传区域（含PDF和粘贴图片） */}
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="application/pdf,image/*" capture="environment" multiple className="hidden" onChange={handleFileSelect} />
                {/* 粘贴图片预览（显示在上传区域内） */}
                {pastedImages.length > 0 && (
                  <div className="flex justify-center gap-2 mb-3 flex-wrap">
                    {pastedImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`粘贴图片${i + 1}`}
                          className="w-14 h-14 object-cover rounded border-2 border-blue-300"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); removePastedImage(i); }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Plus className="w-8 h-8" />
                     <p className="text-xs">支持: PDF 文件（文字或扫描件）和图片（拍照或相册）</p>
                  <p className="text-xs">支持：PDF 文件（文字或扫描件）</p>
                  <p className="text-xs text-blue-500 mt-1">
                    💡 也可直接 <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs font-mono border border-blue-200">Ctrl+V</kbd> 粘贴图片（名片、截图等）
                  </p>
                </div>
              </div>

              {/* 已上传的PDF列表 */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileIcon className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`}</p>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              {pdfStatus && (
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pdfStatus}
                </div>
              )}
            </div>

            {/* Manual Input */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 list-none flex items-center gap-1">
                <span>展开补充信息</span>
                <span className="text-xs group-open:rotate-90 transition-transform">▶</span>
              </summary>
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label>补充背景</Label>
                  <Textarea placeholder="补充任何有助于筛查的背景信息…" value={background} onChange={e => setBackground(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>资产/财务信息</Label>
                  <Input placeholder="可选填写" value={assets} onChange={e => setAssets(e.target.value)} />
                </div>
              </div>
            </details>

            {/* 生成按钮 */}
            {!user && parseInt(guestUsed || '0') >= 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 text-center">
                今日免费次数已用完 · <button onClick={() => setShowAuth(true)} className="underline font-medium">登录</button> 或 <button onClick={() => setShowAuth(true)} className="underline font-medium">注册</button>解锁更多次数
              </div>
            )}
            <Button
              className="w-full text-base py-6 bg-blue-600 hover:bg-blue-700"
              onClick={doGenerate}
              disabled={generating || !canGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {generatingPhase === 'searching' ? '正在筛查 …' : '正在分析 …'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  启动魔镜筛查
                </>
              )}
            </Button>

            {/* 平台状态 */}
            {generating && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLATFORMS.map(p => {
                    const state = platformStates[p.id] ?? { status: 'pending', count: 0 };
                    return (
                      <div key={p.id} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm">
                        <PlatformIcon status={state.status} />
                        <span className="flex-1 truncate">{p.flag} {p.name}</span>
                        {state.status === 'pending' && <span className="text-xs text-slate-400">等待</span>}
                        {state.status === 'searching' && <span className="text-xs text-yellow-600">搜索中</span>}
                        {state.status === 'completed' && state.count > 0 && <Badge variant="outline" className="text-xs">{state.count}条</Badge>}
                        {state.status === 'completed' && state.count === 0 && <span className="text-xs text-slate-400">无</span>}
                        {state.status === 'limited' && <span className="text-xs text-slate-400">需人工</span>}
                        {state.status === 'failed' && <span className="text-xs text-red-400">失败</span>}
                      </div>
                    );
                  })}
                </div>
                {pdfStatus && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {pdfStatus}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 说明 */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>⚠️ 本工具仅供参考，不构成法律意见。重要决策建议咨询持牌律师。</p>
          <p>数据来源：公开网页信息，结果仅供参考，不保证准确性。</p>
        </div>
      </div>

      {/* 登录/注册弹窗 */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">登录 / 注册</CardTitle>
                <button onClick={() => setShowAuth(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <CardDescription className="text-xs">登录后可解锁更多筛查次数，报告永久保存</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showForgot ? (
                <>
                  {!resetSent ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">手机号 / 邮箱</Label>
                        <Input placeholder="登录邮箱" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs">密码</Label>
                          <button onClick={() => setShowForgot(true)} className="text-xs text-blue-500 hover:underline">忘记密码？</button>
                        </div>
                        <Input type="password" placeholder="密码" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                      </div>
                      <Button className="w-full" onClick={handleLogin} disabled={loggingIn}>
                        {loggingIn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 登录中…</> : '登录'}
                      </Button>
                      <div className="text-center text-xs text-slate-400">
                        没有账号？<button onClick={() => { setRegName(''); setRegEmail(''); setRegPassword(''); setRegPhone(''); setRegName_(''); }} className="text-blue-500 hover:underline">立即注册</button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">或</span></div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => { setRegName(''); setRegEmail(''); setRegPassword(''); setRegPhone(''); setRegName_(''); }}>注册新账号</Button>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="font-medium">重置链接已发送</p>
                      <p className="text-sm text-slate-500">请查收邮箱 {resetEmail} 中的重置邮件</p>
                      <Button variant="outline" className="w-full" onClick={() => { setShowForgot(false); setResetSent(false); }}>返回登录</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">邮箱地址</Label>
                    <Input type="email" placeholder="your@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={handleResetPassword} disabled={resetting}>
                    {resetting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 发送中…</> : '发送重置链接'}
                  </Button>
                  <Button variant="ghost" className="w-full text-sm" onClick={() => setShowForgot(false)}>返回登录</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-4xl">🔒</div>
              <div>
                <h3 className="font-semibold text-lg">完整报告解锁</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">¥99 / 次</p>
                <p className="text-xs text-slate-400 mt-1">含详细风险分析 · 行动清单 · 法律建议</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPayMethod('wechat')} className={`flex-1 py-2 rounded-lg border text-sm ${payMethod === 'wechat' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200'}`}>微信购买</button>
                <button onClick={() => setPayMethod('alipay')} className={`flex-1 py-2 rounded-lg border text-sm ${payMethod === 'alipay' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200'}`}>支付宝购买</button>
              </div>
              <Button className="w-full" onClick={handlePayment} disabled={creatingOrder}>
                {creatingOrder ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 创建订单…</> : payMethod === 'wechat' ? '微信支付 ¥99' : '支付宝支付 ¥99'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// 辅助：File → Base64
function blobToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 辅助：File 图标
function FileIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}
