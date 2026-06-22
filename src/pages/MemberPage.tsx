import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Loader2,
  FileText,
  Eye,
  Download,
  Upload,
  Copy,
  Users,
  ShieldCheck,
  Mic,
  Bell,
  CalendarDays,
  Gift,
  Plus,
} from 'lucide-react'
import { getUserReports, getUserInvitations } from '@/services/api'
import { getUserCertifications } from '@/services/certification'
import { sendRenewalReminder, getUserReminders } from '@/services/reminder'
import type { Report } from '@/types/types'
import type { CertificationApplication } from '@/types/certification'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

const riskLabels: Record<string, string> = {
  high: '🔴 高风险',
  medium: '🟡 中风险',
  low: '🟢 低风险',
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '生成中',
  completed: '已完成',
  updating: '更新中',
}

function getDaysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null
  const exp = new Date(expiresAt).getTime()
  const now = Date.now()
  const diff = exp - now
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
}

function getMembershipLabel(type: string | undefined) {
  switch (type) {
    case 'premium':
      return '高级会员'
    case 'standard':
      return '普通会员'
    default:
      return '免费会员'
  }
}

export default function MemberPage() {
  const { t } = useTranslation()
  const { user, profile, session } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [invitations, setInvitations] = useState({ count: 0, rewarded: 0, pending: 0 })
  const [certApps, setCertApps] = useState<CertificationApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [showReminder, setShowReminder] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])
  const [giftBalance, setGiftBalance] = useState(0)
  const [showGiftDialog, setShowGiftDialog] = useState(false)
  const [claimCode, setClaimCode] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)

  const daysLeft = getDaysUntilExpiry(profile?.membership_expires_at)
  const isPaidMember = profile?.membership_type === 'standard' || profile?.membership_type === 'premium'

  useEffect(() => {
    if (user) {
      Promise.all([
        getUserReports(user.id),
        getUserInvitations(user.id),
        getUserCertifications(user.id),
        getUserReminders(user.id),
      ]).then(([r, i, c, rem]) => {
        setReports(r)
        setInvitations(i)
        setCertApps(c)
        setReminders(rem)
        setLoading(false)
        if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && profile?.renewal_reminder_sent !== true) {
          setShowReminder(true)
        }
      })

      // 加载礼品卡余额
      if (session?.access_token) {
        fetch(`${SUPABASE_URL}/functions/v1/Gift-card?action=balance`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then((r) => r.json())
          .then((d) => setGiftBalance(d.balance ?? 0))
          .catch(() => {})
      }
    }
  }, [user, session])

  const handleSendReminder = async () => {
    if (!user) return
    setSendingReminder(true)
    const result = await sendRenewalReminder(user.id)
    setSendingReminder(false)
    if (result.success) {
      toast.success('提醒发送成功')
      setShowReminder(false)
      const rem = await getUserReminders(user.id)
      setReminders(rem)
    } else {
      toast.error(result.error || '发送失败')
    }
  }

  const handleClaimGift = async () => {
    if (!claimCode.trim() || !session?.access_token) return
    setGiftLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/Gift-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'claim', code: claimCode.trim() }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(data.message || '兑换成功')
        setClaimCode('')
        setShowGiftDialog(false)
        const balRes = await fetch(`${SUPABASE_URL}/functions/v1/Gift-card?action=balance`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const balData = await balRes.json()
        setGiftBalance(balData.balance ?? 0)
      }
    } catch {
      toast.error('兑换失败，请稍后重试')
    }
    setGiftLoading(false)
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldCheck className="w-16 h-16 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">请先登录</h2>
        <p className="text-gray-500 mb-6">登录后即可查看和管理您的报告</p>
        <Link to="/auth">
          <Button className="bg-blue-600 hover:bg-blue-700">前往登录</Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 用户信息 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || '用户'}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{getMembershipLabel(profile?.membership_type)}</Badge>
                {profile?.role === 'admin' && <Badge variant="destructive">管理员</Badge>}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t('memberCenter.freeTimesLeft')}: {profile?.free_reports_remaining ?? 0}
              </p>
              {daysLeft !== null && daysLeft > 0 && isPaidMember && (
                <p className="text-sm text-blue-600 mt-1 font-medium">
                  {daysLeft <= 7 ? `会员将于${daysLeft}天后到期` : `会员剩余${daysLeft}天`}
                </p>
              )}
              {daysLeft !== null && daysLeft <= 0 && isPaidMember && (
                <p className="text-sm text-red-500 mt-1">{t('memberCenter.expired')}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 管理员入口 */}
      {profile?.role === 'admin' && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-blue-800">管理员控制台</h3>
                <p className="text-sm text-blue-600">管理认证申请、审核用户提交材料</p>
              </div>
              <Link to="/admin">
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  {t('memberCenter.enterAdmin')} →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 我的邀请码 + 分享推广 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 邀请码 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-yellow-600" />
              <h3 className="font-bold">我的邀请码</h3>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
              <span className="text-lg font-mono font-bold text-blue-700">
                {profile?.invite_code || '---'}
              </span>
              {profile?.invite_code && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.invite_code!)
                    toast.success('邀请码已复制')
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 text-center">
              已邀请 {invitations.count} 人 · 已获奖励 {invitations.rewarded * 5} 次
            </p>
          </CardContent>
        </Card>

        {/* 礼品卡余额 */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Gift className="w-4 h-4 text-yellow-600" />
              </div>
              <h3 className="font-bold">礼品卡余额</h3>
            </div>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-yellow-700">{giftBalance}</p>
              <p className="text-sm text-gray-500">次免费魔镜报告</p>
            </div>
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => setShowGiftDialog(true)}
            >
              <Gift className="w-4 h-4 mr-1" /> 兑换礼品码
            </Button>
          </CardContent>
        </Card>

        {/* 分享按钮 */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold">🌟 分享帮助他人，获得更多免费报告</h3>
                <p className="text-sm text-gray-500">
                  每邀请一位好友注册并购买付费报告，您可获得 5次 免费初筛报告机会
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/auth/register?ref=${profile?.invite_code || ''}`
                  const shareText = `我在用跨境家和的魔镜AI筛查工具，帮您识别跨境婚恋/合作中的风险。使用我的邀请码「${profile?.invite_code || ''}」注册，双方均可获得奖励！`
                  if (navigator.share) {
                    navigator.share({ title: '跨境家和·魔镜', text: shareText, url: shareUrl })
                  } else {
                    navigator.clipboard.writeText(shareText + ' ' + shareUrl)
                    toast.success('分享文案已复制到剪贴板')
                  }
                }}
              >
                <Users className="w-4 h-4 mr-1" /> {t('memberCenter.shareBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 到期提醒弹窗 */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('memberCenter.expiryReminder')}</DialogTitle>
            <DialogDescription>您的会员将于 {daysLeft} 天 后到期</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-600">{t('memberCenter.expiryDesc')}</p>
          <div className="flex gap-3 mt-4">
            {sendingReminder ? (
              <Button disabled>
                <Loader2 className="w-4 h-4 animate-spin mr-1" /> 发送中...
              </Button>
            ) : (
              <Button onClick={handleSendReminder} className="flex-1">
                {t('memberCenter.sendSms')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowReminder(false)}>
              {t('memberCenter.later')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 提醒记录 */}
      {reminders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" /> {t('memberCenter.reminderHistory')}
            </h3>
            <div className="space-y-2">
              {reminders.slice(0, 3).map((rem: any) => (
                <div key={rem.id} className="flex items-center justify-between text-sm">
                  <span>
                    {rem.status === 'sent' ? '✅ 已发送' : rem.status === 'failed' ? '❌ 发送失败' : '⏳ 等待发送'}
                  </span>
                  <span className="text-gray-400">{new Date(rem.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 兑换礼品码弹窗 */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-600" /> 兑换礼品码
            </DialogTitle>
            <DialogDescription>
              输入您获得的礼品码，获得免费魔镜报告次数
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">礼品码</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-center font-mono uppercase tracking-wider"
                placeholder="请输入礼品码"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={!claimCode.trim() || giftLoading}
              onClick={handleClaimGift}
            >
              {giftLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              立即兑换
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 认证申请记录 */}
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-600" /> 我的安心认证
        </h3>
        {certApps.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 mb-3">暂无认证申请</p>
              <Link to="/certification">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  {t('memberCenter.applyCert')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {certApps.map((app: CertificationApplication) => {
              const statusLabel =
                app.status === 'pending'
                  ? '待审核'
                  : app.status === 'ai_review'
                    ? 'AI审核中'
                    : app.status === 'manual_review'
                      ? '人工复核中'
                      : app.status === 'approved'
                        ? '已通过'
                        : app.status === 'rejected'
                          ? '已驳回'
                          : app.status
              const statusColor =
                app.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : app.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : app.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
              const levelLabel =
                app.level === 'basic' ? '基础认证' : app.level === 'standard' ? '标准认证' : '金牌认证'
              return (
                <Card key={app.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge variant="outline">{levelLabel}</Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {app.full_name} · {app.id_type === 'passport' ? '护照' : '身份证'} ·{' '}
                          {new Date(app.created_at).toLocaleDateString('zh-CN')}
                        </p>
                        {app.admin_note && (
                          <p className="text-sm text-red-500 mt-1">备注：{app.admin_note}</p>
                        )}
                        {app.voice_note_url && (
                          <p className="text-xs text-green-600 mt-1">🎤 {t('memberCenter.voiceSubmitted')}</p>
                        )}
                      </div>
                      {app.status === 'approved' && (
                        <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 报告列表 */}
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-600" /> 我的魔镜报告
        </h3>
        {reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Mic className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">暂无报告记录</p>
              <Link to="/magic-mirror">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" /> {t('memberCenter.startFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report: Report) => (
              <Card key={report.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold">{report.subject_name}</h4>
                        {report.risk_level && riskLabels[report.risk_level] && (
                          <span className="text-sm">{riskLabels[report.risk_level]}</span>
                        )}
                        <Badge variant="secondary">{statusLabels[report.status]}</Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {report.report_number} · {new Date(report.created_at).toLocaleDateString('zh-CN')} · V
                        {report.version}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.info('正在加载报告...')
                          window.open(`/report/${report.id}`, '_blank')
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" /> {t('memberCenter.viewBtn')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info('PDF下载功能即将上线')}>
                        <Download className="w-4 h-4 mr-1" /> {t('memberCenter.downloadBtn')}
                      </Button>
                      <Link to={`/magic-mirror?update=${report.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Upload className="w-4 h-4 mr-1" /> {t('memberCenter.updateBtn')}
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
  )
}
