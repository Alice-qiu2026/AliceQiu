import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, FileText, Eye, Download, Upload, Copy, Users, ShieldCheck, Mic, Bell, CalendarDays, Gift, Plus } from 'lucide-react';
import { getUserReports, getUserInvitations } from '@/services/api';
import { getUserCertifications } from '@/services/certification';
import { sendRenewalReminder, getUserReminders } from '@/services/reminder';
import type { Report } from '@/types/types';
import type { CertificationApplication } from '@/types/certification';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

const riskLabels: Record<string, string> = {
  high: '🔴 高风险',
  medium: '🟡 中风险',
  low: '🟢 低风险',
};
const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '生成中',
  completed: '已完成',
  updating: '更新中',
};

function getDaysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = exp - now;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

function getMembershipLabel(type: string | undefined) {
  switch (type) {
    case 'premium':
      return '高级会员';
    case 'standard':
      return '普通会员';
    default:
      return '免费会员';
  }
}

export default function MemberPage() {
  const { t } = useTranslation();
  const { user, profile, session } = useAuth();
  const [reports, setReports] = useState([]);
  const [invitations, setInvitations] = useState({ count: 0, rewarded: 0, pending: 0 });
  const [certApps, setCertApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [giftBalance, setGiftBalance] = useState(0);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);

  const daysLeft = getDaysUntilExpiry(profile?.membership_expires_at);
  const isPaidMember = profile?.membership_type === 'standard' || profile?.membership_type === 'premium';
  const needsReminder = isPaidMember && daysLeft !== null && daysLeft <= 7;

  useEffect(() => {
    if (user) {
      Promise.all([
        getUserReports(user.id),
        getUserInvitations(user.id),
        getUserCertifications(user.id),
        getUserReminders(user.id),
      ]).then(([r, i, c, rem]) => {
        setReports(r);
        setInvitations(i);
        setCertApps(c);
        setReminders(rem);
        setLoading(false);

        if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && profile?.renewal_reminder_sent !== true) {
          setShowReminder(true);
        }
      });

      // 加载礼品卡余额
      if (session?.access_token) {
        fetch(`${SUPABASE_URL}/functions/v1/Gift-card?action=balance`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then(r => r.json())
          .then(d => setGiftBalance(d.balance ?? 0))
          .catch(() => {});
      }
    }
  }, [user, session]);

  const handleSendReminder = async () => {
    if (!user) return;
    setSendingReminder(true);
    const result = await sendRenewalReminder(user.id);
    setSendingReminder(false);
    if (result.success) {
      toast.success('提醒发送成功');
      setShowReminder(false);
      const rem = await getUserReminders(user.id);
      setReminders(rem);
    } else {
      toast.error(result.error || '发送失败');
    }
  };

  const handleClaimGift = async () => {
    if (!claimCode.trim() || !session?.access_token) return;
    setGiftLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/Gift-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'claim', code: claimCode.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message);
        setClaimCode('');
        setShowGiftDialog(false);
        // 刷新余额
        const balRes = await fetch(`${SUPABASE_URL}/functions/v1/Gift-card?action=balance`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const balData = await balRes.json();
        setGiftBalance(balData.balance ?? 0);
      }
    } catch {
      toast.error('兑换失败，请稍后重试');
    }
    setGiftLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">请先登录</p>
          <Link to="/auth/login">
            <Button>前往登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* 用户信息 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || '用户'}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{getMembershipLabel(profile?.membership_type)}</Badge>
                {profile?.role === 'admin' && (
                  <Badge variant="destructive">管理员</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('memberCenter.freeTimesLeft')}: </span>
              <span className="font-medium">{profile?.free_reports_remaining ?? 0}</span>
            </div>
            {daysLeft !== null && daysLeft > 0 && isPaidMember && (
              <div>
                <span className="text-muted-foreground">
                  {daysLeft <= 7 ? `会员将于${daysLeft}天后到期` : `会员剩余${daysLeft}天`}
                </span>
              </div>
            )}
            {daysLeft !== null && daysLeft <= 0 && isPaidMember && (
              <div>
                <span className="text-red-500 font-medium">{t('memberCenter.expired')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 管理员入口 */}
      {profile?.role === 'admin' && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <Link to="/admin" className="flex items-center justify-between hover:underline">
              <div>
                <p className="font-medium text-primary">管理员控制台</p>
                <p className="text-sm text-muted-foreground">管理认证申请、审核用户提交材料</p>
              </div>
              <span className="text-sm text-primary">{t('memberCenter.enterAdmin')} →</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 我的邀请码 + 分享推广 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* 邀请码 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">🎁 我的邀请码</p>
                <p className="text-xl font-mono font-bold tracking-wider">
                  {profile?.invite_code || '---'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (profile?.invite_code) {
                    navigator.clipboard.writeText(profile.invite_code);
                    toast.success('邀请码已复制');
                  }
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-1" /> 复制
              </Button>
              <div className="flex-1 text-right text-xs text-muted-foreground pt-1">
                已邀请 {invitations.count} 人 · 已获奖励 {invitations.rewarded * 5} 次
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 礼品卡余额 */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">礼品卡余额</p>
                <p className="text-2xl font-bold text-yellow-600">{giftBalance} 次</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGiftDialog(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> 兑换礼品码
              </Button>
              <div className="flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分享按钮 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-yellow-50">🌟 分享帮助他人，获得更多免费报告</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            每邀请一位好友注册并购买付费报告，您可获得 <strong>5次</strong> 免费初筛报告机会
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const shareUrl = `${window.location.origin}/auth/register?ref=${profile?.invite_code || ''}`;
              const shareText = `我在用跨境家和的魔镜AI筛查工具，帮您识别跨境婚恋/合作中的风险。使用我的邀请码「${profile?.invite_code || ''}」注册，双方均可获得奖励！`;
              if (navigator.share) {
                navigator.share({ title: '跨境家和·魔镜', text: shareText, url: shareUrl });
              } else {
                navigator.clipboard.writeText(shareText + ' ' + shareUrl);
                toast.success('分享文案已复制到剪贴板');
              }
            }}
          >
            {t('memberCenter.shareBtn')}
          </Button>
        </CardContent>
      </Card>

      {/* 到期提醒弹窗 */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('memberCenter.expiryReminder')}</DialogTitle>
            <DialogDescription>
              您的会员将于 <strong>{daysLeft}</strong> 天 后到期
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">{t('memberCenter.expiryDesc')}</p>
            {sendingReminder ? (
              <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90"
                  onClick={handleSendReminder}
                >
                  {t('memberCenter.sendSms')}
                </Button>
                <Button variant="outline" onClick={() => setShowReminder(false)}>
                  {t('memberCenter.later')}
                </Button>
              </div>
            )}
          </div>
          {/* 提醒记录 */}
          {reminders.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">{t('memberCenter.reminderHistory')}</p>
              {reminders.slice(0, 3).map((rem: any) => (
                <div key={rem.id} className="flex justify-between text-xs text-muted-foreground py-1 border-t">
                  <span>{rem.status === 'sent' ? '已发送' : rem.status === 'failed' ? '发送失败' : '等待发送'}</span>
                  <span>{new Date(rem.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 兑换礼品码弹窗 */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>兑换礼品码</DialogTitle>
            <DialogDescription>输入您获得的礼品码，获得免费魔镜报告次数</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">礼品码</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="例如：qiu202606230001"
                value={claimCode}
                onChange={e => setClaimCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              disabled={!claimCode.trim() || giftLoading}
              onClick={handleClaimGift}
            >
              {giftLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              立即兑换
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 认证申请记录 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-primary mb-4">我的安心认证</h3>
          {certApps.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="mb-3">暂无认证申请</p>
              <Link to="/certification">
                <Button variant="outline" size="sm">{t('memberCenter.applyCert')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {certApps.map((app: CertificationApplication) => {
                const statusLabel = app.status === 'pending' ? '待审核' : app.status === 'ai_review' ? 'AI审核中' : app.status === 'manual_review' ? '人工复核中' : app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '已驳回' : app.status;
                const statusColor = app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700';
                const levelLabel = app.level === 'basic' ? '基础认证' : app.level === 'standard' ? '标准认证' : '金牌认证';
                return (
                  <div key={app.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{levelLabel}</Badge>
                      <Badge className={statusColor}>{statusLabel}</Badge>
                      <span className="text-sm">{app.full_name} · {app.id_type === 'passport' ? '护照' : '身份证'} · {new Date(app.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {app.admin_note && (
                      <span className="text-xs text-muted-foreground">备注：{app.admin_note}</span>
                    )}
                    {app.voice_note_url && (
                      <a href={app.voice_note_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                        {t('memberCenter.voiceSubmitted')}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 报告列表 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-primary mb-4">我的魔镜报告</h3>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">暂无报告记录</p>
              <Link to="/magic-mirror">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('memberCenter.startFirst')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report: Report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-primary truncate">{report.subject_name}</h4>
                          {report.risk_level && riskLabels[report.risk_level] && (
                            <span className="text-xs">{riskLabels[report.risk_level]}</span>
                          )}
                          <Badge variant="outline" className="text-xs">{statusLabels[report.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {report.report_number} · {new Date(report.created_at).toLocaleDateString('zh-CN')} · V{report.version}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={`/magic-mirror/report/${report.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {t('memberCenter.viewBtn')}
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info('PDF下载功能即将上线')}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          {t('memberCenter.downloadBtn')}
                        </Button>
                        <Link to={`/magic-mirror/report/${report.id}`}>
                          <Button variant="outline" size="sm">
                            <Upload className="w-3.5 h-3.5 mr-1" />
                            {t('memberCenter.updateBtn')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
