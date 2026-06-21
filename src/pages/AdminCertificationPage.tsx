import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ArrowLeft,
  Shield,
  ShieldCheck,
  Crown,
  Eye,
  FileText,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllCertifications, updateCertificationStatus } from '@/services/certification';
import { sendRenewalReminder } from '@/services/reminder';
import type { CertificationApplication } from '@/types/certification';
import { useTranslation } from 'react-i18next';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  ai_review: { label: 'AI审核中', color: 'bg-blue-100 text-blue-700' },
  manual_review: { label: '人工复核中', color: 'bg-purple-100 text-purple-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
};

const levelMap: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  basic: { label: '基础认证', icon: Shield, color: '#3498db' },
  standard: { label: '标准认证', icon: ShieldCheck, color: '#2980b9' },
  gold: { label: '金牌认证', icon: Crown, color: '#D4AF37' },
};

export default function AdminCertificationPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<CertificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CertificationApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('无权访问');
      navigate('/');
      return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    const data = await getAllCertifications();
    setApplications(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selected) return;
    setUpdating(true);
    const ok = await updateCertificationStatus(selected.id, status, adminNote);
    setUpdating(false);
    if (ok) {
      toast.success(t('admin.certification.statusUpdateSuccess'));
      setDetailOpen(false);
      setAdminNote('');
      loadData();
    } else {
      toast.error('更新失败');
    }
  };

  const filteredApps = filter === 'all'
    ? applications
    : applications.filter((a) => a.status === filter);

  const handleSendBulkReminders = async () => {
    setSendingReminder(true);
    const result = await sendRenewalReminder();
    setSendingReminder(false);
    if (result.success) {
      toast.success(`已处理 ${result.count || 0} 位到期会员的提醒`);
    } else {
      toast.error(result.error || '批量发送失败');
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    ai_review: applications.filter((a) => a.status === 'ai_review').length,
    manual_review: applications.filter((a) => a.status === 'manual_review').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部 */}
      <div className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/member')}
            className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            返回会员中心
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🔐 安心认证审核后台</h1>
              <p className="text-sm opacity-80 mt-1">
                {t('admin.certification.subtitle')}
              </p>
            </div>
            <Button
              onClick={handleSendBulkReminders}
              disabled={sendingReminder}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/40 shrink-0"
            >
              {sendingReminder ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Bell className="w-4 h-4 mr-1" />
              )}
              {t('admin.certification.sendReminders')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '待审核', value: stats.pending, color: 'text-yellow-600' },
            { label: 'AI审核中', value: stats.ai_review, color: 'text-blue-600' },
            { label: '已通过', value: stats.approved, color: 'text-green-600' },
            { label: '已驳回', value: stats.rejected, color: 'text-red-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待审核' },
            { key: 'ai_review', label: 'AI审核中' },
            { key: 'manual_review', label: '人工复核中' },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已驳回' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredApps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">暂无申请记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const levelInfo = levelMap[app.level] || levelMap.basic;
              const statusInfo = statusMap[app.status] || statusMap.pending;
              const LevelIcon = levelInfo.icon;
              return (
                <Card
                  key={app.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelected(app); setAdminNote(app.admin_note || ''); setDetailOpen(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: levelInfo.color + '15' }}
                        >
                          <LevelIcon className="w-5 h-5" style={{ color: levelInfo.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-primary text-sm">
                              {(app as any).applicant_name || app.full_name || '未知用户'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {levelInfo.label}
                            </Badge>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(app as any).applicant_email || ''} · {app.id_type === 'passport' ? '护照' : '身份证'}: {app.id_number.slice(0, 4)}****{app.id_number.slice(-2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                        <span>{new Date(app.created_at).toLocaleDateString('zh-CN')}</span>
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.certification.detailTitle')}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: (levelMap[selected.level]?.color || '#999') + '15',
                  }}
                >
                  {(levelMap[selected.level]?.icon || Shield)({ className: 'w-6 h-6', style: { color: levelMap[selected.level]?.color || '#999' } })}
                </div>
                <div>
                  <p className="font-bold text-primary">{selected.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {levelMap[selected.level]?.label} · {statusMap[selected.status]?.label}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">证件类型</span>
                  <span>{selected.id_type === 'passport' ? '护照' : '身份证'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">证件号码</span>
                  <span>{selected.id_number}</span>
                </div>
                {selected.marital_status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">婚姻状况</span>
                    <span>
                      {selected.marital_status === 'single' ? '未婚' :
                        selected.marital_status === 'married' ? '已婚' :
                        selected.marital_status === 'divorced' ? '离异' :
                        selected.marital_status === 'widowed' ? '丧偶' : selected.marital_status}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提交时间</span>
                  <span>{new Date(selected.created_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              {selected.relationship_questionnaire && (
                <div>
                  <p className="text-sm font-medium text-primary mb-1">关系透明问卷</p>
                  <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                    {selected.relationship_questionnaire}
                  </p>
                </div>
              )}

              {/* 语音自述 */}
              {selected.voice_note_url && (
                <div>
                  <p className="text-sm font-medium text-primary mb-2">语音自述</p>
                  <audio
                    src={selected.voice_note_url}
                    controls
                    className="w-full h-10"
                  />
                </div>
              )}

              {/* 材料链接 */}
              <div>
                <p className="text-sm font-medium text-primary mb-2">上传材料</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'id_document_url', label: '身份证/护照' },
                    { key: 'marriage_certificate_url', label: '婚姻证明' },
                    { key: 'asset_proof_url', label: '资产证明' },
                    { key: 'no_crime_record_url', label: '无犯罪记录' },
                  ].map((f) => {
                    const url = (selected as any)[f.key];
                    if (!url) return null;
                    return (
                      <a
                        key={f.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {f.label}
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* 审核备注 */}
              <div>
                <p className="text-sm font-medium text-primary mb-1">审核备注</p>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={t('admin.certification.reviewNotePlaceholder')}
                  className="min-h-[80px]"
                />
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {selected.status !== 'approved' && (
                  <Button
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : '通过认证'}
                  </Button>
                )}
                {selected.status !== 'rejected' && (
                  <Button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={updating}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : '驳回申请'}
                  </Button>
                )}
                {selected.status !== 'ai_review' && selected.status !== 'approved' && selected.status !== 'rejected' && (
                  <Button
                    onClick={() => handleUpdateStatus('ai_review')}
                    disabled={updating}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : '标记AI审核'}
                  </Button>
                )}
                {selected.status !== 'manual_review' && selected.status !== 'approved' && selected.status !== 'rejected' && (
                  <Button
                    onClick={() => handleUpdateStatus('manual_review')}
                    disabled={updating}
                    variant="outline"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : '标记人工复核'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
