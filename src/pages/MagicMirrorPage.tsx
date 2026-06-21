import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, X, CheckCircle2, AlertCircle, Clock, Lock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createReport, updateFreeReports, createPaymentOrder, createAlipayOrder } from '@/services/api';
import { supabase } from '@/db/supabase';
import type { ReportData } from '@/types/types';
import { useTranslation } from 'react-i18next';

// 平台状态图标（必须定义在组件外，避免每次渲染创建新组件类型）
const statusLabel: Record<PlatformStatus, string> = {
  pending:   '等待中',
  searching: '查询中…',
  completed: '完成',
  limited:   '需人工核实',
  failed:    '失败',
};

function PlatformIcon({ status }: { status: PlatformStatus }) {
  if (status === 'pending')   return <Clock className="w-4 h-4 text-muted-foreground" />;
  if (status === 'searching') return <Search className="w-4 h-4 text-primary animate-pulse" />;
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (status === 'limited')   return <Lock className="w-4 h-4 text-amber-500" />;
  return <AlertCircle className="w-4 h-4 text-destructive" />;
}

// 平台列表
const PLATFORMS = [
  { id: 'baidu',       name: '百度搜索',        flag: '🔍' },
  { id: 'google',      name: 'Google 搜索',     flag: '🌐' },
  { id: 'weibo',       name: '微博',             flag: '📱' },
  { id: 'zhihu',       name: '知乎',             flag: '💡' },
  { id: 'wechat',      name: '微信公众号',        flag: '💬' },
  { id: 'toutiao',     name: '今日头条',          flag: '📰' },
  { id: 'douyin',      name: '抖音/TikTok',      flag: '🎵' },
  { id: 'bilibili',    name: 'B站',              flag: '📺' },
  { id: 'xiaohongshu', name: '小红书',            flag: '📕' },
  { id: 'news',        name: '新闻媒体',          flag: '📡' },
  { id: 'github',      name: 'GitHub',           flag: '💻' },
  { id: 'pdf',         name: '上传文件分析',       flag: '📄' },
  { id: 'tianyancha',  name: '天眼查',            flag: '🏢', limited: true },
  { id: 'court',       name: '裁判文书网',         flag: '⚖️', limited: true },
  { id: 'linkedin',    name: 'LinkedIn',          flag: '👔', limited: true },
];

type PlatformStatus = 'pending' | 'searching' | 'completed' | 'limited' | 'failed';

interface PlatformState {
  id: string;
  name: string;
  flag: string;
  status: PlatformStatus;
  count: number;
  limited?: boolean;
}

// ── PDF 文字提取工具（客户端 OCR + 智能检测）─────────────────

type PdfResult = {
  name: string;
  text: string;       // 提取的文字（发往后端的核心数据）
  isScanned: boolean; // 是否为扫描件
  pages: number;      // 页数
};

// 快速检测 PDF 是否为扫描件（读前 1KB 找 BT 文本块）
async function isTextPdf(file: File): Promise<boolean> {
  const slice = file.slice(0, 1024);
  const text = await slice.text();
  return text.includes('BT');
}

// 用 PDF.js（CDN）渲染 PDF → canvas → JPEG → OCR.space
async function ocrPdfWithCanvas(file: File, onProgress?: (page: number, total: number) => void): Promise<string> {
  // 动态导入 PDF.js（从 CDN，避免 npm install）
  const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages);
    const page = await pdf.getPage(i);

    // 渲染到 canvas（3x 分辨率保证 OCR 质量，原图 72dpi → 216dpi 精度）
    const viewport = page.getViewport({ scale: 3 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // canvas → JPEG（质量 0.92，约 500KB/页 vs 原 24MB）
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const jpegBase64 = jpegDataUrl.slice(jpegDataUrl.indexOf(',') + 1);

    // 发给 OCR.space（免费 500次/小时，无需 API key）
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${jpegBase64}`);
    formData.append('language', 'chs');          // 简体中文优先
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'true');

    try {
      const ocrResp = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'apikey': 'K87964788988957' }, // OCR.space free tier key
        body: formData,
      });
      const ocrJson = await ocrResp.json();
      if (ocrJson?.ParsedResults?.[0]?.ParsedText) {
        pageTexts.push(ocrJson.ParsedResults.map((r: { ParsedText: string }) => r.ParsedText).join('\n'));
      } else if (ocrJson?.ErrorMessage) {
        console.warn(`[OCR] page ${i} error:`, ocrJson.ErrorMessage);
      }
    } catch (e) {
      console.warn(`[OCR] page ${i} failed:`, e);
    }
  }

  return pageTexts.join('\n\n--- 第X页 ---\n\n');
}

// 从 PDF 直接提取文字（文字层 PDF，无需 OCR）
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const binaryStr = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
  const base64 = btoa(binaryStr);

  // 发给后端 Edge Function 提取文字（复用已有逻辑）
  // 但这里我们在客户端用 pdfjs-dist 做文字提取，避免走网络
  try {
    const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const texts: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: { str?: string }) => (item as { str?: string }).str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) texts.push(pageText);
    }
    return texts.join('\n');
  } catch {
    return '';
  }
}

// 智能处理 PDF：检测类型 → 走对应提取路径
async function processPDFFile(
  file: File,
  onStatus?: (msg: string) => void
): Promise<PdfResult> {
  const name = file.name;
  const sizeMB = file.size / 1024 / 1024;

  // 超大文件（>5MB）直接当扫描件处理，避免加载到内存
  if (sizeMB > 5) {
    onStatus?.(`📄 ${name}（${sizeMB.toFixed(1)}MB）→ 检测为扫描件，开始 OCR…`);
    const text = await ocrPdfWithCanvas(file, (p, t) => onStatus?.(`📄 OCR 第 ${p}/${t} 页…`));
    return { name, text, isScanned: true, pages: 0 };
  }

  // 小文件：先快速检测是否为文字层 PDF
  const hasText = await isTextPdf(file);
  if (hasText) {
    onStatus?.(`📄 ${name} → 文字层 PDF，提取文字中…`);
    const text = await extractTextFromPdf(file);
    return { name, text: text || '', isScanned: false, pages: 0 };
  }

  // 小文件但无文字层 → 扫描件
  onStatus?.(`📄 ${name} → 检测为扫描件，开始 OCR…`);
  const text = await ocrPdfWithCanvas(file, (p, t) => onStatus?.(`📄 OCR 第 ${p}/${t} 页…`));
  return { name, text, isScanned: true, pages: 0 };
}

// 处理所有文件：并发执行，每文件独立 OCR 进度
async function processAllPDFFiles(
  files: File[],
  onFileStatus?: (name: string, msg: string) => void
): Promise<{ results: PdfResult[]; totalText: string }> {
  const results: PdfResult[] = [];
  for (const file of files) {
    const result = await processPDFFile(file, (msg) => onFileStatus?.(file.name, msg));
    results.push(result);
  }
  const totalText = results.map(r => `[${r.name}]\n${r.text}`).join('\n\n');
  return { results, totalText };
}

// ─────────────────────────────────────────────────────────────

export default function MagicMirrorPage() {
  const { t } = useTranslation();
  const { user, profile, signUpWithEmail, signInWithEmail, refreshProfile, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [subjectName, setSubjectName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [background, setBackground] = useState('');
  const [assets, setAssets] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] = useState<'searching' | 'analyzing' | 'done'>('searching');
  const [pdfStatus, setPdfStatus] = useState<string>('');
  const [platformStates, setPlatformStates] = useState<PlatformState[]>(() =>
    PLATFORMS.map(p => ({ ...p, status: 'pending' as PlatformStatus, count: 0 }))
  );
  const abortRef = useRef<AbortController | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [showPaywall, setShowPaywall] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');

  const [guestUsed] = useState(() => localStorage.getItem('guest_report_used') === 'true');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (dropped.length === 0) { toast.error('仅支持 PDF 格式文件'); return; }
    setFiles(prev => [...prev, ...dropped].slice(0, 5));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf');
    setFiles(prev => [...prev, ...picked].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const resetPlatforms = () =>
    setPlatformStates(PLATFORMS.map(p => ({ ...p, status: 'pending' as PlatformStatus, count: 0 })));

  const updatePlatform = (id: string, patch: Partial<PlatformState>) =>
    setPlatformStates(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  // 核心：调用 magic_mirror_v2 SSE 流（支持 pdfText 文字内容）
  const runMirrorV2 = async (guestMode: boolean, pdfText?: string): Promise<ReportData | null> => {
    resetPlatforms();
    setGeneratingPhase('searching');

    // pdfText: 前端已提取的文字（极小体积）；pdfFiles: 保留向后兼容（仅小文件走 base64）
    const pdfFiles: { name: string; base64: string }[] = [];
    for (const file of files) {
      if (file.size < 500_000) { // 只发 < 500KB 的文件做 base64
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        pdfFiles.push({ name: file.name, base64: btoa(binary) });
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const fnUrl = `${supabaseUrl}/functions/v1/magic_mirror_v2`;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const resp = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      // 关键：pdfText 为纯文字（KB 级），base64 仅发小文件（<500KB）
      body: JSON.stringify({ subjectName, relationship, background, assets, pdfFiles, pdfText, guestMode }),
      signal: ctrl.signal,
    });

    if (!resp.ok || !resp.body) throw new Error(`请求失败 (${resp.status})`);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buf = '';
    let reportData: ReportData | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const blocks = buf.split('\n\n');
      buf = blocks.pop() ?? '';

      for (const block of blocks) {
        const lines = block.split('\n');
        let eventName = '';
        let dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) eventName = line.slice(7).trim();
          if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (!dataStr) continue;
        try {
          const payload = JSON.parse(dataStr);
          if (eventName === 'progress') {
            updatePlatform(payload.id, { status: payload.status as PlatformStatus, count: payload.count ?? 0 });
          } else if (eventName === 'searching_done') {
            setGeneratingPhase('analyzing');
          } else if (eventName === 'report_ready') {
            reportData = payload.reportData as ReportData;
          } else if (eventName === 'error') {
            throw new Error(payload.message || '生成失败');
          }
        } catch (parseErr) {
          if ((parseErr as Error).message !== 'JSON parse error') {
            const msg = (parseErr as Error).message;
            if (msg && msg !== 'Unexpected end of JSON input') throw parseErr;
          }
        }
      }
    }
    return reportData;
  };

  const handleStartScreening = async () => {
    if (!subjectName.trim()) { toast.error('请输入被筛查人姓名'); return; }
    if (!user) {
      if (guestUsed) { setAuthTab('register'); setShowAuth(true); return; }
      await doGenerateGuest(); return;
    }
    if ((profile?.free_reports_remaining ?? 0) <= 0) { setShowPaywall(true); return; }
    await doGenerate();
  };

  const doGenerateGuest = async () => {
    setGenerating(true);
    setPdfStatus('');
    try {
      let pdfText: string | undefined;
      if (files.length > 0) {
        setPdfStatus('📄 正在读取文件…');
        const { totalText } = await processAllPDFFiles(files, (name, msg) => setPdfStatus(msg));
        pdfText = totalText;
        setPdfStatus('');
      }
      const reportData = await runMirrorV2(true, pdfText);
      if (!reportData) throw new Error('no data');
      localStorage.setItem('guest_report_used', 'true');
      localStorage.setItem('guest_report_data', JSON.stringify(reportData));
      toast.success(t('magicMirror.reportSuccess'));
      navigate('/magic-mirror/report/guest');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error(t('magicMirror.systemError'));
    } finally {
      setGenerating(false); setGeneratingPhase('searching'); setPdfStatus('');
    }
  };

  const doGenerate = async () => {
    setGenerating(true);
    setPdfStatus('');
    try {
      let pdfText: string | undefined;
      if (files.length > 0) {
        setPdfStatus('📄 正在读取文件…');
        const { totalText } = await processAllPDFFiles(files, (name, msg) => setPdfStatus(msg));
        pdfText = totalText;
        setPdfStatus('');
      }
      const reportData = await runMirrorV2(false, pdfText);
      if (!reportData) throw new Error('no data');

      const riskLevel = reportData.riskSignals.some(s => s.level === 'high') ? 'high'
        : reportData.riskSignals.some(s => s.level === 'medium') ? 'medium' : 'low';

      const report = await createReport(user!.id, subjectName, { relationship, background, assets }, riskLevel, reportData);
      if (report) {
        await updateFreeReports(user!.id, (profile?.free_reports_remaining ?? 1) - 1);
        await refreshProfile();
        toast.success(t('magicMirror.reportGenerated'));
        navigate(`/magic-mirror/report/${report.id}`);
      } else {
        toast.error(t('magicMirror.reportFail'));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error(t('magicMirror.systemError'));
    } finally {
      setGenerating(false); setGeneratingPhase('searching'); setPdfStatus('');
    }
  };

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPhone || !regPassword) { toast.error(t('register.fillAll')); return; }
    setRegistering(true);
    const { error } = await signUpWithEmail(regEmail, regPassword, regName, regPhone);
    setRegistering(false);
    if (error) toast.error(error.message || t('register.registerFail'));
    else { toast.success(t('register.registerSuccess')); setShowAuth(false); setTimeout(() => doGenerate(), 500); }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { toast.error(t('login.fillRequired')); return; }
    setLoggingIn(true);
    const { error } = await signInWithEmail(loginEmail, loginPassword);
    setLoggingIn(false);
    if (error) toast.error(error.message || t('login.loginFail'));
    else { toast.success(t('login.loginSuccess')); setShowAuth(false); setTimeout(() => doGenerate(), 500); }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) { toast.error('请输入邮箱地址'); return; }
    setResetting(true);
    const { error } = await resetPassword(resetEmail);
    setResetting(false);
    if (error) toast.error(error.message || '发送失败，请稍后重试');
    else setResetSent(true);
  };

  const completedCount = platformStates.filter(p => p.status === 'completed').length;
  const totalSearchable = platformStates.filter(p => !p.limited).length;
  const progressPct = totalSearchable > 0 ? Math.round((completedCount / totalSearchable) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260614/image_1781445807493.png"
              alt={t('magicMirror.title') + ' Magic Mirror'}
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">🔮 {t('magicMirror.title')} Magic Mirror</h1>
          <p className="text-lg font-medium text-accent mb-4">{t('magicMirror.slogan')}</p>
          <p className="text-sm opacity-90 max-w-2xl mx-auto">{t('magicMirror.desc')}</p>
        </div>
      </section>

      {/* Input + Search Area */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">

          {/* File Upload */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-sm font-medium mb-3 block">{t('magicMirror.fileUpload')}</Label>
              <div
                onDrop={handleFileDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">{t('magicMirror.dragDrop')}</p>
                <p className="text-xs text-muted-foreground mt-1">支持文字 PDF 和扫描件 · 最多 5 个 · 不限大小</p>
                <input type="file" multiple accept=".pdf" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="mt-4 inline-block cursor-pointer">
                  <Button variant="default" size="default" asChild>
                    <span className="flex items-center gap-2"><Upload className="w-4 h-4" />{t('common.select')}</span>
                  </Button>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded text-sm">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)}MB` : `${(f.size / 1024).toFixed(0)}KB`}
                      </span>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {pdfStatus && (
                <div className="mt-3 flex items-center gap-2 text-sm text-primary bg-primary/5 px-3 py-2 rounded">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate">{pdfStatus}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="subject-name">{t('magicMirror.nameLabel')} *</Label>
                <Input id="subject-name" value={subjectName} onChange={e => setSubjectName(e.target.value)}
                  placeholder={t('magicMirror.namePlaceholder')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="relationship">{t('magicMirror.relationLabel')}</Label>
                <Input id="relationship" value={relationship} onChange={e => setRelationship(e.target.value)}
                  placeholder={t('magicMirror.relationPlaceholder')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="background">{t('magicMirror.backgroundLabel')}</Label>
                <Textarea id="background" value={background} onChange={e => setBackground(e.target.value)}
                  placeholder={t('magicMirror.backgroundPlaceholder')} className="mt-1" rows={3} />
              </div>
              <div>
                <Label htmlFor="assets">{t('magicMirror.assetsLabel')}</Label>
                <Textarea id="assets" value={assets} onChange={e => setAssets(e.target.value)}
                  placeholder={t('magicMirror.assetsPlaceholder')} className="mt-1" rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Guest tip */}
          {!user && (
            <div className={`rounded-lg p-4 text-center text-sm font-medium border ${
              guestUsed
                ? 'bg-muted border-border text-muted-foreground'
                : 'bg-accent/10 border-accent/20 text-accent'
            }`}>
              {guestUsed ? t('magicMirror.guestUsed', { count: 1 }) : t('magicMirror.guestFree')}
            </div>
          )}

          <Button onClick={handleStartScreening} disabled={generating}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base">
            {generating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />正在检索多平台数据，请稍候…</>
            ) : t('magicMirror.startBtn')}
          </Button>

          {/* ── 实时平台搜索进度面板 ── */}
          {generating && (
            <Card className="border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <span className="text-lg">🪄</span> 魔镜正在为您筛查
                  </h3>
                  <Badge variant={generatingPhase === 'analyzing' ? 'default' : 'secondary'} className="text-xs">
                    {generatingPhase === 'searching' ? '🔍 多平台检索中' : '🤖 AI 分析报告中'}
                  </Badge>
                </div>

                {/* 总进度条 */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>检索进度</span>
                    <span>{completedCount} / {totalSearchable} 平台</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${generatingPhase === 'analyzing' ? 100 : progressPct}%` }} />
                  </div>
                </div>

                {/* 平台网格 */}
                <div className="grid grid-cols-1 gap-1.5">
                  {platformStates.map(p => (
                    <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      p.status === 'searching' ? 'bg-primary/10 border border-primary/20' :
                      p.status === 'completed' && p.count > 0 ? 'bg-green-50 dark:bg-green-950/20' :
                      p.status === 'limited' ? 'bg-amber-50 dark:bg-amber-950/20' :
                      'bg-muted/40'
                    }`}>
                      <span className="text-base w-5 text-center shrink-0">{p.flag}</span>
                      <span className="flex-1 min-w-0 font-medium truncate">{p.name}</span>
                      {p.status === 'completed' && p.count > 0 && (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300 shrink-0">
                          {p.count} 条
                        </Badge>
                      )}
                      {p.status === 'limited' && (
                        <span className="text-xs text-amber-600 shrink-0">需人工核实</span>
                      )}
                      <PlatformIcon status={p.status} />
                    </div>
                  ))}
                </div>

                {generatingPhase === 'analyzing' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    DeepSeek · Qwen · Llama 并行生成报告…
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ── Auth Dialog ── */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{authTab === 'register' ? '注册账号' : '登录账号'}</DialogTitle>
            <DialogDescription>
              {authTab === 'register' ? '注册后可查看完整报告并享受会员权益' : '登录以使用魔镜完整功能'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setAuthTab('register')}
              className={`flex-1 py-2 text-sm rounded-md border transition-colors ${authTab === 'register' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
              注册
            </button>
            <button onClick={() => setAuthTab('login')}
              className={`flex-1 py-2 text-sm rounded-md border transition-colors ${authTab === 'login' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
              登录
            </button>
          </div>
          {authTab === 'register' ? (
            <div className="space-y-3">
              <Input placeholder="姓名" value={regName} onChange={e => setRegName(e.target.value)} />
              <Input placeholder="邮箱" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              <Input placeholder="手机号" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
              <Input placeholder="密码" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              <Button onClick={handleRegister} disabled={registering} className="w-full">
                {registering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />注册中…</> : '注册'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="邮箱" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <Input placeholder="密码" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              <Button onClick={handleLogin} disabled={loggingIn} className="w-full">
                {loggingIn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />登录中…</> : '登录'}
              </Button>
              <div className="text-center">
                <button onClick={() => { setShowAuth(false); setShowForgot(true); }} className="text-xs text-muted-foreground hover:text-primary underline">
                  忘记密码？
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Forgot Password Dialog ── */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>输入注册邮箱，我们会发送重置链接</DialogDescription>
          </DialogHeader>
          {resetSent ? (
            <div className="text-center py-4 text-sm text-green-600">
              ✅ 发送成功！请查收邮件（含链接 1 小时内有效）
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="邮箱地址" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
              <Button onClick={handleResetPassword} disabled={resetting} className="w-full">
                {resetting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />发送中…</> : '发送重置链接'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Paywall Dialog ── */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>免费次数已用完</DialogTitle>
            <DialogDescription>解锁魔镜完整功能，继续筛查</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">¥99 / 次</div>
              <div className="text-xs text-muted-foreground">单次购买，不限报告数量</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPayMethod('wechat')}
                className={`flex-1 py-2 text-sm rounded-md border transition-colors ${payMethod === 'wechat' ? 'bg-green-600 text-white border-green-600' : 'border-border hover:bg-muted'}`}>
                微信支付
              </button>
              <button onClick={() => setPayMethod('alipay')}
                className={`flex-1 py-2 text-sm rounded-md border transition-colors ${payMethod === 'alipay' ? 'bg-blue-600 text-white border-blue-600' : 'border-border hover:bg-muted'}`}>
                支付宝
              </button>
            </div>
            <Button onClick={async () => {
              if (!user) return;
              setCreatingOrder(true);
              try {
                if (payMethod === 'wechat') {
                  const order = await createPaymentOrder(user.id);
                  if (order?.paymentUrl) window.location.href = order.paymentUrl;
                } else {
                  const order = await createAlipayOrder(user.id);
                  if (order?.paymentUrl) window.location.href = order.paymentUrl;
                }
              } catch { toast.error('下单失败'); }
              setCreatingOrder(false);
            }}
              disabled={creatingOrder}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {creatingOrder ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('magicMirror.creatingOrder')}</>
              ) : payMethod === 'wechat' ? t('magicMirror.wechatBuy') : t('magicMirror.alipayBuy')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
