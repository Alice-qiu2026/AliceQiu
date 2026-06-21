import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Download, Upload, Loader2, FileText, X, PlusCircle,
  Globe, Shield, CheckCircle2, AlertCircle, ExternalLink, Search, Lock,
} from 'lucide-react';
import { getReportById, updateReport } from '@/services/api';
import { exportElementToPDF } from '@/services/pdfExport';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Report, PlatformSearchResult } from '@/types/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const riskColors: Record<string, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
  unknown: 'bg-gray-100 text-gray-600',
};

const riskLabels: Record<string, string> = {
  high: '🔴 高风险',
  medium: '🟡 中风险',
  low: '🟢 低风险',
  unknown: '⚪ 信息不足',
};

const PLATFORMS = [
  { group: '🌐 搜索引擎', items: ['Google', '百度', 'Bing'] },
  { group: '🏢 企业信息', items: ['天眼查', '企查查', 'Corporations Canada'] },
  { group: '📜 中国法律', items: ['裁判文书网', '中国执行信息公开网'] },
  { group: '📜 加拿大法律', items: ['CanLII', 'Ontario Court', '各省法院'] },
  { group: '💼 职业社交', items: ['LinkedIn', 'Instagram'] },
  { group: '📱 社交媒体', items: ['小红书', '微信', '微博', 'Facebook'] },
  { group: '🏠 财产登记', items: ['中国土地注册局', '加拿大土地注册局', 'MPAC'] },
  { group: '💳 信用记录', items: ['Equifax Canada', 'TransUnion Canada'] },
  { group: '📰 新闻媒体', items: ['CBC News', 'Global News', '新浪新闻', '腾讯新闻'] },
];

export default function ReportDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newEvidence, setNewEvidence] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const isFreeUser = !profile || profile.membership_type === 'free';

  useEffect(() => {
    if (id === 'guest') {
      const raw = localStorage.getItem('guest_report_data');
      if (raw) {
        const guestData = JSON.parse(raw);
        const signals = Array.isArray(guestData.riskSignals)
          ? (guestData.riskSignals as { level: string }[]).filter(s => typeof s === 'object' && s !== null)
          : [];
        setReport({
          id: 'guest',
          user_id: 'guest',
          subject_name: guestData.identityVerification?.name || '未知',
          subject_info: null,
          report_number: 'GUEST-001',
          risk_level: signals.some(s => s.level === 'high') ? 'high'
            : signals.some(s => s.level === 'medium') ? 'medium'
            : signals.some(s => s.level === 'unknown') ? 'unknown'
            : 'low',
          status: 'completed',
          version: 1,
          parent_report_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          report_data: guestData,
        });
      }
      setLoading(false);
      return;
    }
    if (id) {
      getReportById(id).then((r) => {
        setReport(r);
        setLoading(false);
      });
    }
  }, [id]);

  const handleExportPDF = async () => {
    if (!reportContentRef.current) return;
    setExportingPDF(true);
    try {
      const filename = `${report?.report_number || '魔镜报告'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportElementToPDF(reportContentRef.current, filename);
      toast.success('PDF 下载成功');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '请重试';
      toast.error('PDF导出失败：' + msg);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleUpdate = () => {
    setNewEvidence('');
    setNewFiles([]);
    setShowUpdateDialog(true);
  };

  const handleExportMD = () => {
    const rd = report?.report_data;
    if (!rd) return;
    const riskLabel: Record<string, string> = { high: '🔴 高风险', medium: '🟡 中风险', low: '🟢 低风险' };
    const levelLabel: Record<string, string> = { high: '🔴 高风险', medium: '🟡 中风险', low: '🟢 低风险' };

    let md = `# 跨境家和·魔镜 初筛报告\n\n`;
    md += `**被筛查人：** ${rd.identityVerification?.name || report?.subject_info?.name || '-'}\n`;
    md += `**报告编号：** ${report?.report_number || '-'}\n`;
    md += `**生成日期：** ${report?.created_at ? new Date(report.created_at).toLocaleDateString('zh-CN') : '-'}\n`;
    md += `**风险等级：** ${levelLabel[rd.risk_level] || rd.risk_level}\n\n`;

    md += `---\n\n## 一、身份核验\n\n`;
    const iv = rd.identityVerification || {};
    md += `| 项目 | 内容 |\n|---|---|\n`;
    md += `| 姓名 | ${iv.name || '-'} |\n`;
    md += `| 年龄 | ${iv.age || '暂无公开数据'} |\n`;
    md += `| 职业 | ${iv.occupation || '暂无公开数据'} |\n`;
    md += `| 所在地 | ${iv.location || '暂无公开数据'} |\n`;
    md += `| 国籍 | ${iv.nationality || '暂无公开数据'} |\n\n`;

    if (rd.riskSignals?.length) {
      md += `---\n\n## 二、风险信号\n\n`;
      rd.riskSignals.forEach((s: { category: string; level: string; description: string }) => {
        md += `### ${s.category} ${levelLabel[s.level] || s.level}\n`;
        md += `${s.description}\n\n`;
      });
    }

    if (rd.uploadedFiles?.length) {
      md += `---\n\n## 三、客户提交资料分析\n\n`;
      rd.uploadedFiles.forEach((f: { name: string; summary: string; extracted: boolean }) => {
        md += `### ${f.name} ${f.extracted ? '✅' : '❌'}\n`;
        md += `${f.summary}\n\n`;
      });
    }

    if (rd.searchResults?.length) {
      md += `---\n\n## 四、各平台搜索结果\n\n`;
      rd.searchResults.forEach((p: PlatformSearchResult) => {
        md += `### ${p.name}\n`;
        md += `**搜索词：** ${p.query}\n`;
        md += `**状态：** ${p.status === 'completed' ? '✅ 完成' : p.status === 'no_results' ? '无结果' : p.status === 'limited' ? '⚠️ 需人工核实' : '❌ 失败'}\n`;
        if (p.findings?.length) {
          p.findings.forEach((f: { title: string; url: string; snippet: string }) => {
            md += `- **${f.title}**\n  ${f.snippet.slice(0, 120)}...\n  来源：${f.url}\n`;
          });
        } else {
          md += `暂无公开搜索结果\n`;
        }
        md += `\n`;
      });
    }

    if (rd.references?.length) {
      md += `---\n\n## 五、参考资料\n\n`;
      rd.references.forEach((r: { platform: string; title: string; url: string }) => {
        md += `- ${r.platform}：${r.title}（${r.url}）\n`;
      });
      md += `\n`;
    }

    md += `---\n\n## 六、综合评级\n\n${rd.overallRating || '-'}\n\n`;

    if (rd.actionChecklist) {
      const ac = rd.actionChecklist;
      md += `---\n\n## 七、行动清单\n\n`;
      if (ac.online?.length) { md += `**线上核实**\n${ac.online.map((i: string) => `- ${i}`).join('\n')}\n\n`; }
      if (ac.proactive?.length) { md += `**主动核查**\n${ac.proactive.map((i: string) => `- ${i}`).join('\n')}\n\n`; }
      if (ac.onsite?.length) { md += `**实地核实**\n${ac.onsite.map((i: string) => `- ${i}`).join('\n')}\n\n`; }
    }

    md += `---\n\n> 🔒 本报告仅供参考，不构成法律意见。如有需要，请联系跨境家和获取专业法律建议。\n`;
    md += `> **跨境家和·魔镜** | crossborderjiahe.com\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report?.report_number || '魔镜报告'}_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown 报告下载成功');
  };

  const handleNewFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setNewFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = '';
  };

  const handleSubmitUpdate = async () => {
    if (!report) return;
    if (!newEvidence.trim() && newFiles.length === 0) {
      toast.error('请填写补充说明或上传文件');
      return;
    }
    setUpdating(true);
    setShowUpdateDialog(false);
    try {
      const originalBg = (report.subject_info as Record<string, string> | null)?.background || '';
      const originalAssets = (report.subject_info as Record<string, string> | null)?.assets || '';
      const combinedBackground = newEvidence
        ? `${originalBg}\n\n【补充材料 v${report.version + 1}】${newEvidence}`
        : originalBg;

      const { data, error } = await supabase.functions.invoke('magic_mirror_report', {
        body: {
          subjectName: report.subject_name,
          relationship: (report.subject_info as Record<string, string> | null)?.relationship || '',
          background: combinedBackground,
          assets: originalAssets,
          guestMode: report.id === 'guest',
        },
      });

      if (error || !data?.reportData) throw new Error(error?.message || '分析失败');

      if (report.id === 'guest') {
        const updated = { ...report, report_data: data.reportData, version: report.version + 1, updated_at: new Date().toISOString() };
        setReport(updated as Report);
        localStorage.setItem('guest_report_data', JSON.stringify(data.reportData));
        toast.success('报告已根据补充材料重新分析');
      } else {
        const ok = await updateReport(report.id, {
          status: 'completed',
          version: report.version + 1,
          report_data: data.reportData,
        });
        if (ok) {
          setReport((prev) => prev ? { ...prev, report_data: data.reportData, version: prev.version + 1, status: 'completed' } : prev);
          toast.success('报告已根据补充材料重新分析');
        } else {
          toast.error('保存失败，请重试');
        }
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || '补充分析失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report || !report.report_data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">报告不存在或数据异常</p>
        <Link to="/member"><Button variant="outline">返回会员中心</Button></Link>
      </div>
    );
  }

  const data = report.report_data;
  const safeSignals = Array.isArray(data.riskSignals)
    ? (data.riskSignals as unknown[]).filter(
        (s): s is { category: string; level: string; description: string } =>
          typeof s === 'object' && s !== null && 'category' in s && 'level' in s,
      )
    : [];
  const safeRecs = Array.isArray(data.recommendations) ? data.recommendations as string[] : [];
  const safeChecklist = (data.actionChecklist && typeof data.actionChecklist === 'object')
    ? data.actionChecklist as { online?: string[]; proactive?: string[]; onsite?: string[] }
    : { online: [], proactive: [], onsite: [] };

  const subjectInfo = report.subject_info as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 返回按钮（PDF 区外） */}
        <Link to="/member" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回会员中心
        </Link>

        {/* ── PDF 导出内容区 ── */}
        <div ref={reportContentRef} className="bg-white relative">

          {/* 免费会员水印 */}
          {isFreeUser && (
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-[#CCCCCC] text-2xl font-bold select-none whitespace-nowrap"
                  style={{
                    opacity: 0.5,
                    transform: 'rotate(-45deg)',
                    top: `${i * 14}%`,
                    left: `${(i % 2) * 15 - 10}%`,
                    letterSpacing: '0.2em',
                  }}
                >
                  跨境家和 魔镜
                </div>
              ))}
            </div>
          )}

          {/* ── 第1页：封面 ── */}
          <div className="mb-6 overflow-hidden rounded-xl border border-border shadow-sm">
            {/* 页眉 */}
            <div className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: '#D4AF37' }}>跨境家和</p>
                  <p className="text-xs opacity-70">crossborderjiahe.com</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>跨境家和·魔镜 初筛报告</p>
                <p className="text-xs opacity-70 mt-0.5">让跨境家庭更幸福</p>
              </div>
            </div>

            {/* 封面主体 */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl font-bold text-[#1E3A5F]">风险筛查报告</h1>
                <Badge className={riskColors[report.risk_level] ?? riskColors['unknown']}>
                  {riskLabels[report.risk_level] ?? '⚪ 信息不足'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">被筛查人</p>
                  <p className="font-semibold">{report.subject_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">报告编号</p>
                  <p className="font-semibold text-xs">{report.report_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">生成日期</p>
                  <p className="font-semibold">{new Date(report.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">版本</p>
                  <p className="font-semibold">V{report.version}</p>
                </div>
              </div>
            </div>

            {/* 页脚 */}
            <div className="bg-[#1E3A5F]/5 border-t border-border px-6 py-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>跨境家和·魔镜</span>
              <span>{report.report_number}</span>
              <span className="font-bold text-destructive">保密</span>
            </div>
          </div>

          {/* ── 第2页：身份核验 + 风险信号 + 客户提交资料 ── */}
          <Card className="mb-6">
            <CardHeader className="bg-[#1E3A5F]/5 rounded-t-lg pb-3">
              <CardTitle className="text-base text-[#1E3A5F]">第二页 · 身份核验 + 风险信号</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* 身份核验表格 */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-[#1E3A5F]">身份核验</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-muted/40 p-4 rounded-lg">
                  {Object.entries(data.identityVerification as Record<string, string>).map(([key, val]) => {
                    const labels: Record<string, string> = { name: '姓名', age: '年龄', occupation: '职业', location: '所在地', nationality: '国籍' };
                    return (
                      <div key={key}>
                        <p className="text-muted-foreground text-xs">{labels[key] || key}</p>
                        <p className="font-medium">{String(val)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* 风险信号矩阵（四色标签） */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-[#1E3A5F]">风险信号矩阵</h3>
                <div className="space-y-2">
                  {safeSignals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无风险信号数据，请补充材料后重新分析。</p>
                  ) : safeSignals.map((sig, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                      <Badge className={riskColors[sig.level] ?? riskColors['unknown']} style={{ whiteSpace: 'nowrap' }}>
                        {riskLabels[sig.level] ?? '⚪ 信息不足'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{sig.category}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sig.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 客户提交资料 */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-[#1E3A5F]">客户提交资料</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-muted-foreground font-normal whitespace-nowrap">序号</th>
                        <th className="text-left py-2 pr-4 text-muted-foreground font-normal whitespace-nowrap">资料类型</th>
                        <th className="text-left py-2 pr-4 text-muted-foreground font-normal whitespace-nowrap">内容摘要</th>
                        <th className="text-left py-2 text-muted-foreground font-normal whitespace-nowrap">提交时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectInfo?.background && (
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 whitespace-nowrap">1</td>
                          <td className="py-2 pr-4 whitespace-nowrap">文字陈述</td>
                          <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate">{subjectInfo.background.slice(0, 60)}{subjectInfo.background.length > 60 ? '…' : ''}</td>
                          <td className="py-2 whitespace-nowrap text-muted-foreground">{new Date(report.created_at).toLocaleString('zh-CN')}</td>
                        </tr>
                      )}
                      {subjectInfo?.assets && (
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 whitespace-nowrap">2</td>
                          <td className="py-2 pr-4 whitespace-nowrap">资产/财务</td>
                          <td className="py-2 pr-4 text-muted-foreground max-w-xs truncate">{subjectInfo.assets.slice(0, 60)}{subjectInfo.assets.length > 60 ? '…' : ''}</td>
                          <td className="py-2 whitespace-nowrap text-muted-foreground">{new Date(report.created_at).toLocaleString('zh-CN')}</td>
                        </tr>
                      )}
                      {!subjectInfo?.background && !subjectInfo?.assets && (
                        <tr>
                          <td colSpan={4} className="py-3 text-muted-foreground text-center">暂无客户提交资料记录</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
            {/* 页脚 */}
            <div className="bg-[#1E3A5F]/5 border-t border-border px-6 py-2 flex items-center justify-between text-xs text-muted-foreground rounded-b-lg">
              <span>跨境家和·魔镜</span>
              <span>{report.report_number}</span>
              <span className="font-bold text-destructive">保密</span>
            </div>
          </Card>

          {/* ── 第2.5页：上传文件分析 + 真实搜索过程 ── */}
          {((data.uploadedFiles && data.uploadedFiles.length > 0) || (data.searchResults && data.searchResults.length > 0)) && (
            <Card className="mb-6">
              <CardHeader className="bg-[#1E3A5F]/5 rounded-t-lg pb-3">
                <CardTitle className="text-base text-[#1E3A5F]">第二页（续）· 文件分析 + 搜索过程</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">

                {/* 上传文件分析 */}
                {data.uploadedFiles && data.uploadedFiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-[#1E3A5F] flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      第一步：上传文件分析
                    </h3>
                    <div className="space-y-3">
                      {data.uploadedFiles.map((f, i) => (
                        <div key={i} className="border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium text-sm truncate flex-1">{f.name}</span>
                            <Badge variant={f.extracted ? 'default' : 'secondary'} className="text-xs shrink-0">
                              {f.extracted ? '✓ 已提取文字' : '⚠ 扫描件'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed pl-6">{f.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.uploadedFiles && data.uploadedFiles.length > 0 && data.searchResults && data.searchResults.length > 0 && (
                  <Separator />
                )}

                {/* 真实搜索过程 */}
                {data.searchResults && data.searchResults.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3 text-[#1E3A5F] flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      第二步：各平台实际搜索结果
                    </h3>
                    <div className="space-y-2">
                      {(data.searchResults as PlatformSearchResult[]).map((r) => (
                        <div key={r.id} className={`rounded-lg border p-3 ${
                          r.status === 'limited'    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200' :
                          r.status === 'completed'  ? 'bg-green-50 dark:bg-green-950/20 border-green-200' :
                          r.status === 'no_results' ? 'bg-muted/30 border-border' :
                          'bg-muted/30 border-border'
                        }`}>
                          <div className="flex items-start gap-2 mb-1">
                            {r.status === 'limited' ? (
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            ) : r.status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-xs">{r.name}</span>
                                {r.status === 'limited' && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">需人工核实</Badge>
                                )}
                                {r.status === 'completed' && (
                                  <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                                    找到 {r.findings.length} 条
                                  </Badge>
                                )}
                                {r.status === 'no_results' && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">未查到公开记录</Badge>
                                )}
                              </div>
                              {r.query && r.status !== 'limited' && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  搜索词：<code className="bg-muted px-1 rounded">{r.query}</code>
                                </p>
                              )}
                              {r.status === 'limited' && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{r.findings.length === 0 ? '本系统未接入此平台，需用户自行登录查询' : ''}</p>
                              )}
                            </div>
                          </div>
                          {/* 搜索结果条目 */}
                          {r.findings.length > 0 && (
                            <div className="mt-2 space-y-1.5 pl-5">
                              {r.findings.slice(0, 3).map((f, fi) => (
                                <div key={fi} className="text-xs border-l-2 border-green-300 pl-2">
                                  <div className="flex items-start gap-1">
                                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                                      className="font-medium text-primary hover:underline flex items-center gap-0.5 leading-tight">
                                      {f.title}
                                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                    </a>
                                  </div>
                                  {f.snippet && (
                                    <p className="text-muted-foreground mt-0.5 line-clamp-2">{f.snippet}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="bg-[#1E3A5F]/5 border-t border-border px-6 py-2 flex items-center justify-between text-xs text-muted-foreground rounded-b-lg">
                <span>跨境家和·魔镜</span>
                <span>{report.report_number}</span>
                <span className="font-bold text-destructive">保密</span>
              </div>
            </Card>
          )}


          <Card className="mb-6">
            <CardHeader className="bg-[#1E3A5F]/5 rounded-t-lg pb-3">
              <CardTitle className="text-base text-[#1E3A5F]">第三页 · 综合评估 + 魔镜建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* 综合评级 */}
              <div className="border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">综合评级</p>
                <p className="text-xl font-bold" style={{ color: '#1E3A5F' }}>{String(data.overallRating) || '—'}</p>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: '🔴 红灯 - 高风险', desc: '发现重大风险信号' },
                    { label: '🟡 黄灯 - 需关注', desc: '存在部分风险信号' },
                    { label: '🟢 绿灯 - 低风险', desc: '未发现明显风险' },
                    { label: '⚪ 白灯 - 信息不足', desc: '公开信息有限' },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/40 rounded p-2">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 魔镜建议 */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-[#1E3A5F]">魔镜建议</h3>
                {safeRecs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无建议，请尝试重新分析。</p>
                ) : (
                  <div className="space-y-2">
                    {safeRecs.map((rec, i) => (
                      <div key={i} className="flex gap-3 text-sm p-3 bg-muted/30 rounded-lg">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold text-white" style={{ background: '#1E3A5F' }}>
                          {i + 1}
                        </span>
                        <p className="text-foreground leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="bg-[#1E3A5F]/5 border-t border-border px-6 py-2 flex items-center justify-between text-xs text-muted-foreground rounded-b-lg">
              <span>跨境家和·魔镜</span>
              <span>{report.report_number}</span>
              <span className="font-bold text-destructive">保密</span>
            </div>
          </Card>

          {/* ── 第4页：核查清单 + 搜索范围 + 免责声明 ── */}
          <Card className="mb-6">
            <CardHeader className="bg-[#1E3A5F]/5 rounded-t-lg pb-3">
              <CardTitle className="text-base text-[#1E3A5F]">第四页 · 核查清单 + 搜索范围 + 免责声明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* 三类行动清单 */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '🔍', title: '线上可查清单', items: safeChecklist.online ?? [] },
                  { icon: '📋', title: '主动核实清单', items: safeChecklist.proactive ?? [] },
                  { icon: '🏢', title: '实地核查清单', items: safeChecklist.onsite ?? [] },
                ].map((section) => (
                  <div key={section.title} className="bg-muted/30 rounded-lg p-3">
                    <h3 className="font-semibold text-sm mb-2">{section.icon} {section.title}</h3>
                    <ul className="space-y-1">
                      {section.items.length === 0
                        ? <li className="text-xs text-muted-foreground">暂无</li>
                        : section.items.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span style={{ color: '#D4AF37' }}>•</span>{item}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Separator />

              {/* 搜索平台汇总（基于真实数据或兼容旧版静态列表） */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-[#1E3A5F]" />
                  <h3 className="font-semibold text-sm text-[#1E3A5F]">
                    {data.searchResults
                      ? `已查询 ${(data.searchResults as PlatformSearchResult[]).filter(r => r.status !== 'limited').length} 个平台，${(data.searchResults as PlatformSearchResult[]).filter(r => r.status === 'limited').length} 个需人工核实`
                      : '搜索平台概况'}
                  </h3>
                </div>
                {data.searchResults ? (
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    {(data.searchResults as PlatformSearchResult[]).map(r => (
                      <div key={r.id} className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                        r.status === 'completed'  ? 'bg-green-50 dark:bg-green-950/20' :
                        r.status === 'limited'    ? 'bg-amber-50 dark:bg-amber-950/20' :
                        'bg-muted/40'
                      }`}>
                        {r.status === 'completed'  ? <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" /> :
                         r.status === 'limited'    ? <Lock className="w-3 h-3 text-amber-500 shrink-0" /> :
                         <AlertCircle className="w-3 h-3 text-muted-foreground shrink-0" />}
                        <span className="flex-1 truncate font-medium">{r.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {r.status === 'completed'  ? `${r.findings.length} 条` :
                           r.status === 'limited'    ? '人工核实' :
                           '无记录'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 旧版报告兼容：静态列表 */
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { group: '🌐 搜索引擎', items: ['Google', '百度', 'Bing'] },
                      { group: '🏢 企业信息', items: ['天眼查', '企查查', 'Corporations Canada'] },
                      { group: '📜 中国法律', items: ['裁判文书网', '中国执行信息公开网'] },
                      { group: '📜 加拿大法律', items: ['CanLII', 'Ontario Court'] },
                      { group: '💼 职业社交', items: ['LinkedIn', 'Instagram'] },
                      { group: '📱 社交媒体', items: ['小红书', '微信', '微博'] },
                      { group: '📰 新闻媒体', items: ['CBC News', 'Global News', '新浪新闻'] },
                    ].map((group) => (
                      <div key={group.group} className="text-xs">
                        <p className="font-medium mb-1">{group.group}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.items.map((item) => (
                            <span key={item} className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* 免责声明 */}
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#1E3A5F]" />
                  <h3 className="font-semibold text-sm text-[#1E3A5F]">免责声明</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  本报告由跨境家和·魔镜 AI 系统根据用户提供信息及公开数据自动生成，仅供参考，不构成任何法律建议或法律意见。
                  魔镜 AI 不对报告的完整性、准确性及时效性作出任何保证。用户应自行判断报告内容的适用性，并承担相应风险。
                  本报告依据 PIPEDA（加拿大个人信息保护及电子文件法）及中国个人信息保护法相关规定处理数据，严格保密，禁止用于商业用途。
                  跨境家和为律师引荐平台，不直接提供法律服务，所有法律服务由持牌合作律师独立提供。
                </p>
                <p className="text-xs text-[#1E3A5F] font-medium mt-2">
                  © 2026 跨境家和 · crossborderjiahe.com · 本报告属于保密文件
                </p>
              </div>
            </CardContent>
            <div className="bg-[#1E3A5F]/5 border-t border-border px-6 py-2 flex items-center justify-between text-xs text-muted-foreground rounded-b-lg">
              <span>跨境家和·魔镜</span>
              <span>{report.report_number}</span>
              <span className="font-bold text-destructive">保密</span>
            </div>
          </Card>

        {/* PDF内容区结束 */}
        </div>

        {/* 操作按钮（PDF 区外） */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={handleExportPDF} disabled={exportingPDF}>
            {exportingPDF
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成PDF中…</>
              : <><Download className="w-4 h-4 mr-2" />下载PDF报告</>}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleExportMD}>
            <Download className="w-4 h-4 mr-2" />下载Markdown报告
          </Button>
          <Button
            className="flex-1 text-white hover:opacity-90"
            style={{ background: '#1E3A5F' }}
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />更新中…</>
              : <><Upload className="w-4 h-4 mr-2" />补充新证据/材料</>}
          </Button>
        </div>
      </div>

      {/* ── 补充材料弹窗 ── */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" style={{ color: '#D4AF37' }} />
              补充新证据 / 材料
            </DialogTitle>
            <DialogDescription>填写补充说明或上传文件后，魔镜将重新分析并更新报告。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="new-evidence" className="text-sm font-normal">补充说明（可选）</Label>
              <Textarea
                id="new-evidence"
                value={newEvidence}
                onChange={(e) => setNewEvidence(e.target.value)}
                placeholder="请描述新发现的情况、证据或需要重新评估的信息…"
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <Label className="text-sm font-normal">上传文件（可选，最多 5 个）</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground mb-2">支持 PDF、Word、图片，单文件最大 10MB</p>
                <input type="file" multiple id="update-file-upload" onChange={handleNewFileSelect} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                <label htmlFor="update-file-upload" className="cursor-pointer">
                  <Button variant="default" size="sm" asChild>
                    <span className="flex items-center gap-2"><Upload className="w-4 h-4" />选择文件</span>
                  </Button>
                </label>
              </div>
              {newFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded text-sm">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <button onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} className="flex-1">取消</Button>
            <Button onClick={handleSubmitUpdate} disabled={updating} className="flex-1 text-white" style={{ background: '#1E3A5F' }}>
              <Upload className="w-4 h-4 mr-2" />提交并重新分析
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重新分析进度遮罩 */}
      {updating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3 max-w-xs w-full mx-4 shadow-2xl">
            <Loader2 className="w-10 h-10 mx-auto animate-spin" style={{ color: '#D4AF37' }} />
            <p className="text-sm font-medium">正在根据补充材料重新分析…</p>
            <p className="text-xs text-muted-foreground">Groq · DeepSeek · Qwen 并行处理中</p>
          </div>
        </div>
      )}
    </div>
  );
}
