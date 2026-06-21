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
import { Loader2, FileText, Eye, Download, Upload, Copy, Users, ShieldCheck, Mic, Bell, CalendarDays } from 'lucide-react';
import PosterGenerator from '@/components/PosterGenerator';
import { getUserReports, getUserInvitations } from '@/services/api';
import { getUserCertifications } from '@/services/certification';
import { sendRenewalReminder, getUserReminders } from '@/services/reminder';
import type { Report } from '@/types/types';
import type { CertificationApplication } from '@/types/certification';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
    case 'premium': return '高级会员';
    case 'standard': return '普通会员';
    default: return '免费会员';
  }
}

export default function MemberPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [invitations, setInvitations] = useState({ count: 0, rewarded: 0, pending: 0 });
  const [certApps, setCertApps] = useState<CertificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);

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
        // 检查是否需要弹出到期提醒（首次进入会员中心时）
        if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && profile?.renewal_reminder_sent !== true) {
          setShowReminder(true);
        }
      });
    }
  }, [user]);

  const handleSendReminder = async () => {
    if (!user) return;
    setSendingReminder(true);
    const result = await sendRenewalReminder(user.id);
    setSendingReminder(false);
    if (result.success) {
      toast.success('提醒发送成功');
      setShowReminder(false);
      // 刷新提醒记录
      const rem = await getUserReminders(user.id);
      setReminders(rem);
    } else {
      toast.error(result.error || '发送失败');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">请先登录</p>
        <Link to="/auth/login">
          <Button>前往登录</Button>
        </Link>
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
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 用户信息 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                <img
                  src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260614/image_1781447425475.png"
                  alt="用户头像"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">{profile?.full_name || '用户'}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {getMembershipLabel(profile?.membership_type)}
                  </Badge>
                  {profile?.role === 'admin' && (
                    <Badge variant="outline" className="text-xs">管理员</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {t('memberCenter.freeTimesLeft')}: {profile?.free_reports_remaining ?? 0}
                  </span>
                  {daysLeft !== null && daysLeft > 0 && isPaidMember && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      daysLeft <= 7 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      <CalendarDays className="w-3 h-3" />
                      {daysLeft <= 7 ? `会员将于${daysLeft}天后到期` : `会员剩余${daysLeft}天`}
                    </span>
                  )}
                  {daysLeft !== null && daysLeft <= 0 && isPaidMember && (
                    <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {t('memberCenter.expired')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 管理员入口 */}
        {profile?.role === 'admin' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800">管理员控制台</h3>
                  <p className="text-sm text-red-700/80">管理认证申请、审核用户提交材料</p>
                </div>
                <Link to="/admin/certifications">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    {t('memberCenter.enterAdmin')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 我的邀请码 + 分享推广 */}
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* 邀请码 */}
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <div className="text-2xl shrink-0">🎁</div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">我的邀请码</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <code className="text-2xl font-bold text-primary tracking-wider bg-white/60 px-3 py-1 rounded">
                      {profile?.invite_code || '---'}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (profile?.invite_code) {
                          navigator.clipboard.writeText(profile.invite_code);
                          toast.success('邀请码已复制');
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{invitations.count}</p>
                    <p className="text-xs text-muted-foreground">已邀请</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{invitations.rewarded * 5}</p>
                    <p className="text-xs text-muted-foreground">已获奖励</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-primary/20 pt-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="text-3xl shrink-0">🌟</div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-primary mb-1">分享帮助他人，获得更多免费报告</h3>
                    <p className="text-sm text-muted-foreground">
                      每邀请一位好友注册并购买付费报告，您可获得 <span className="font-bold text-primary">5次</span> 免费初筛报告机会
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <PosterGenerator inviteCode={profile?.invite_code || ''} />
                    <Button
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
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
                      <Users className="w-4 h-4 mr-1" />
                      {t('memberCenter.shareBtn')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 到期提醒弹窗 */}
        <Dialog open={showReminder} onOpenChange={setShowReminder}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                {t('memberCenter.expiryReminder')}
              </DialogTitle>
              <DialogDescription className="text-center">
                您的会员将于 <span className="font-bold text-primary">{daysLeft} 天</span> 后到期
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t('memberCenter.expiryDesc')}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                >
                  {sendingReminder ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Bell className="w-4 h-4 mr-1" />
                  )}
                  {t('memberCenter.sendSms')}
                </Button>
                <Link to="/join">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    {t('memberCenter.renewNow')}
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => setShowReminder(false)}>
                  {t('memberCenter.later')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 提醒记录 */}
        {reminders.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t('memberCenter.reminderHistory')}
              </h3>
              <div className="space-y-2">
                {reminders.slice(0, 3).map((rem) => (
                  <div key={rem.id} className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">
                      {rem.status === 'sent' ? '已发送' : rem.status === 'failed' ? '发送失败' : '等待发送'}
                    </span>
                    <span className="text-xs text-amber-600">
                      {new Date(rem.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 认证申请记录 */}
        <h3 className="text-lg font-bold text-primary mb-4">我的安心认证</h3>
        {certApps.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm mb-3">暂无认证申请</p>
              <Link to="/certification">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('memberCenter.applyCert')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {certApps.map((app) => {
              const statusLabel =
                app.status === 'pending' ? '待审核' :
                app.status === 'ai_review' ? 'AI审核中' :
                app.status === 'manual_review' ? '人工复核中' :
                app.status === 'approved' ? '已通过' :
                app.status === 'rejected' ? '已驳回' : app.status;
              const statusColor =
                app.status === 'approved' ? 'bg-green-100 text-green-700' :
                app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700';
              const levelLabel = app.level === 'basic' ? '基础认证' : app.level === 'standard' ? '标准认证' : '金牌认证';
              return (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-primary text-sm">{levelLabel}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {app.full_name} · {app.id_type === 'passport' ? '护照' : '身份证'} · {new Date(app.created_at).toLocaleDateString('zh-CN')}
                      </p>
                      {app.admin_note && (
                        <p className="text-xs text-red-600 mt-1">备注：{app.admin_note}</p>
                      )}
                      {app.voice_note_url && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          {t('memberCenter.voiceSubmitted')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 报告列表 */}
        <h3 className="text-lg font-bold text-primary mb-4">我的魔镜报告</h3>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">暂无报告记录</p>
              <Link to="/magic-mirror">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('memberCenter.startFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-primary truncate">{report.subject_name}</h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {riskLabels[report.risk_level]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {statusLabels[report.status]}
                        </Badge>
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
                        <Button
                          variant="outline"
                          size="sm"
                        >
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
      </div>
    </div>
  );
}