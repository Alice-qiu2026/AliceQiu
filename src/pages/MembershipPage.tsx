import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Star, Zap } from 'lucide-react';

export default function MembershipPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const pricingPlans = [
    {
      key: 'free',
      icon: <Zap className="w-6 h-6" />,
      name: lang === 'zh' ? '免费会员' : 'Free',
      subtitle: lang === 'zh' ? '探索跨境家和' : 'Explore CrossBorder JiaHe',
      price: lang === 'zh' ? '¥0' : '$0',
      period: lang === 'zh' ? '永久免费' : 'Forever free',
      badge: null,
      highlight: false,
      cta: lang === 'zh' ? '免费注册' : 'Sign Up Free',
      ctaLink: '/auth/register',
      benefits: lang === 'zh' ? [
        'AI协商中心：36分钟免费',
        '超出 ¥200/小时，按每6分钟计费',
        '魔镜报告：2份免费，超出 ¥49/份',
        '家和成长营：仅线上活动',
        '安心认证：¥699/次',
        '邀请奖励：每邀请1位付费会员+5份魔镜报告',
      ] : [
        'AI Negotiation Center: 36 min free',
        'Overage ¥200/hr, billed per 6 min',
        'Magic Mirror: 2 free reports, ¥49/extra',
        'Growth Camp: Online only',
        'Peace of Mind Cert: ¥699/session',
        'Referral reward: +5 Mirror reports per paid referral',
      ],
    },
    {
      key: 'standard',
      icon: <Star className="w-6 h-6" />,
      name: lang === 'zh' ? '普通会员' : 'Standard',
      subtitle: lang === 'zh' ? '全面守护家庭' : 'Full Family Protection',
      price: lang === 'zh' ? '¥2,999' : '¥2,999',
      period: lang === 'zh' ? '/年 或 ¥249/月' : '/year or ¥249/mo',
      badge: lang === 'zh' ? '最受欢迎' : 'Most Popular',
      highlight: true,
      cta: lang === 'zh' ? '立即开通' : 'Get Started',
      ctaLink: '/auth/register',
      benefits: lang === 'zh' ? [
        'AI协商中心：每月2小时免费（独立计时）',
        '超出 ¥100/小时，可9折预约律师/调解员',
        '魔镜报告：10次/月',
        '家和成长营：线上 + 线下活动',
        '安心认证：¥399/次（立省¥300）',
        '邀请奖励：每邀请1位付费会员延长1个月',
      ] : [
        'AI Negotiation Center: 2 hrs free/month (independent timer)',
        'Overage ¥100/hr, 10% off attorney/mediator bookings',
        'Magic Mirror: 10 reports/month',
        'Growth Camp: Online + Offline events',
        'Peace of Mind Cert: ¥399/session',
        'Referral reward: +1 month membership per paid referral',
      ],
    },
    {
      key: 'premium',
      icon: <Crown className="w-6 h-6" />,
      name: lang === 'zh' ? '高级会员' : 'Premium',
      subtitle: lang === 'zh' ? '蓝标专属尊享' : 'Blue Badge Exclusive',
      price: lang === 'zh' ? '¥5,999' : '¥5,999',
      period: lang === 'zh' ? '/年 或 ¥599/月' : '/year or ¥599/mo',
      badge: lang === 'zh' ? '蓝标专属' : 'Blue Badge',
      highlight: false,
      cta: lang === 'zh' ? '升级高级' : 'Go Premium',
      ctaLink: '/auth/register',
      benefits: lang === 'zh' ? [
        'AI协商中心：每月4小时免费（独立计时）',
        '超出 ¥50/小时，可8折预约律师/调解员',
        '魔镜报告：20次/月',
        '家和成长营：线上+线下+每季度蓝标专属活动',
        '安心认证：免费1次（价值¥699）',
        '蓝标认证徽章 · 优先展示',
        '邀请奖励：每邀请1位付费会员延长1个月',
      ] : [
        'AI Negotiation Center: 4 hrs free/month (independent timer)',
        'Overage ¥50/hr, 20% off attorney/mediator bookings',
        'Magic Mirror: 20 reports/month',
        'Growth Camp: Online + Offline + Quarterly Blue Badge events',
        'Peace of Mind Cert: 1 free/year (¥699 value)',
        'Blue Badge · Priority listing',
        'Referral reward: +1 month membership per paid referral',
      ],
    },
  ];

  const comparisonRows = [
    // ── AI协商中心（独立计时） ──
    {
      feature: lang === 'zh' ? 'AI协商中心（免费时长/月）' : 'AI Negotiation Center (free/month)',
      free: lang === 'zh' ? '36分钟' : '36 min',
      standard: lang === 'zh' ? '2小时' : '2 hrs',
      premium: lang === 'zh' ? '4小时' : '4 hrs',
      highlight: false,
    },
    {
      feature: lang === 'zh' ? 'AI协商超出计费（最小计费单位0.1小时）' : 'AI Center overage (min. 0.1 hr)',
      free: lang === 'zh' ? '¥200/小时' : '¥200/hr',
      standard: lang === 'zh' ? '¥100/小时' : '¥100/hr',
      premium: lang === 'zh' ? '¥50/小时' : '¥50/hr',
      highlight: false,
    },
    {
      feature: lang === 'zh' ? '律师/调解员预约折扣' : 'Attorney/mediator discount',
      free: '—',
      standard: lang === 'zh' ? '9折' : '10% off',
      premium: lang === 'zh' ? '8折' : '20% off',
      highlight: false,
    },
    // ── 安心认证 ──
    {
      feature: lang === 'zh' ? '安心认证' : 'Peace of Mind Cert',
      free: '¥699',
      standard: '¥399',
      premium: lang === 'zh' ? '免费1次' : '1 free',
      highlight: false,
    },
    // ── 邀请朋友奖励（独立行） ──
    {
      feature: lang === 'zh' ? '邀请朋友奖励（每成功邀请1位付费会员）' : 'Referral Reward (per paid referral)',
      free: lang === 'zh' ? '+5份魔镜报告' : '+5 Mirror reports',
      standard: lang === 'zh' ? '延长1个月普通会员' : '+1 month Standard',
      premium: lang === 'zh' ? '延长1个月高级会员' : '+1 month Premium',
      highlight: true,
    },
    // ── 魔镜报告（独立于AI协商） ──
    {
      feature: lang === 'zh' ? '魔镜报告（次/月）' : 'Magic Mirror reports/month',
      free: lang === 'zh' ? '2份（终身）' : '2 total',
      standard: lang === 'zh' ? '10次/月' : '10/month',
      premium: lang === 'zh' ? '20次/月' : '20/month',
      highlight: false,
    },
    {
      feature: lang === 'zh' ? '魔镜额外购买' : 'Extra Mirror reports',
      free: '¥49/份',
      standard: '¥39/份',
      premium: '¥29/份',
      highlight: false,
    },
    // ── 其他权益 ──
    {
      feature: lang === 'zh' ? '家和成长营' : 'Growth Camp',
      free: lang === 'zh' ? '仅线上' : 'Online only',
      standard: lang === 'zh' ? '线上 + 线下' : 'Online + Offline',
      premium: lang === 'zh' ? '线上+线下+蓝标专属' : 'Online + Offline + Blue Badge',
      highlight: false,
    },
    {
      feature: lang === 'zh' ? '蓝标专属活动' : 'Blue Badge events',
      free: '—',
      standard: '—',
      premium: lang === 'zh' ? '每季度' : 'Quarterly',
      highlight: false,
    },
  ];

  const upgradeSteps = lang === 'zh' ? [
    { arrow: '游客 → 普通会员', desc: '年付¥2,999 或月付¥249，立即解锁全部普通会员权益', color: 'bg-primary/10' },
    { arrow: '普通会员 → 高级会员', desc: '补差价升级，剩余会员天数按比例折算，无需重复购买', color: 'bg-accent/10' },
    { arrow: '续费提醒', desc: '到期前7天自动提醒，支持手动/自动续费，永不中断保护', color: 'bg-secondary/60' },
  ] : [
    { arrow: 'Visitor → Standard', desc: '¥2,999/year or ¥249/month — unlock all Standard benefits immediately', color: 'bg-primary/10' },
    { arrow: 'Standard → Premium', desc: 'Pay the difference only; remaining days are prorated — no double charges', color: 'bg-accent/10' },
    { arrow: 'Renewal Reminders', desc: '7-day advance notice before expiry; auto or manual renewal supported', color: 'bg-secondary/60' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-1 text-sm font-semibold">
            {lang === 'zh' ? '引荐平台会员体系' : 'Referral Platform Membership'}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            {lang === 'zh' ? '选择最适合您的会员等级' : 'Choose the Plan That Fits You'}
          </h1>
          <p className="text-base opacity-90 max-w-2xl mx-auto leading-relaxed text-pretty">
            {lang === 'zh'
              ? '享受 AI 辅助调解、魔镜风险报告、安心认证与成长营——三档会员，全方位守护您的跨境家庭'
              : 'Access AI-assisted mediation, Magic Mirror risk reports, Peace of Mind Certification, and Growth Camp — three tiers to protect your cross-border family'}
          </p>
        </div>
      </section>

      {/* 三档价格卡片 — 已移除，以完整权益对照表为主 */}

      {/* 完整权益对照表（主内容） */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2 text-balance">
              {lang === 'zh' ? '完整权益对照表' : 'Full Benefits Comparison'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '各等级权益详细对比，按需选择最适合的方案' : 'Detailed comparison of all benefits — choose what fits you'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  {/* 价格行 */}
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-5 px-4 md:px-6 min-w-[180px] whitespace-nowrap bg-muted/40">
                      <span className="text-xs text-muted-foreground font-normal">
                        {lang === 'zh' ? '服务项目' : 'Feature'}
                      </span>
                    </th>
                    {/* 免费 */}
                    <th className="text-center py-5 px-4 min-w-[130px] bg-muted/40">
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="font-bold text-primary text-sm">{lang === 'zh' ? '免费会员' : 'Free'}</span>
                      </div>
                    </th>
                    {/* 普通会员 — 高亮 */}
                    <th className="text-center py-5 px-4 min-w-[150px] bg-accent/10 border-x-2 border-accent/40 relative">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-accent rounded-t-sm" />
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-accent" />
                          <span className="text-[10px] font-bold text-accent-foreground bg-accent rounded-full px-1.5 py-0.5">
                            {lang === 'zh' ? '最受欢迎' : 'Popular'}
                          </span>
                        </div>
                        <span className="font-bold text-accent text-sm">{lang === 'zh' ? '普通会员' : 'Standard'}</span>
                        <span className="text-base font-extrabold text-accent whitespace-nowrap">¥2,999{lang === 'zh' ? '/年 或 ¥249/月' : '/yr or ¥249/mo'}</span>
                      </div>
                    </th>
                    {/* 高级会员 */}
                    <th className="text-center py-5 px-4 min-w-[150px] bg-primary/5">
                      <div className="flex flex-col items-center gap-1">
                        <Crown className="w-5 h-5 text-primary" />
                        <span className="font-bold text-primary text-sm">{lang === 'zh' ? '高级会员' : 'Premium'}</span>
                        <span className="text-base font-extrabold text-primary whitespace-nowrap">¥5,999{lang === 'zh' ? '/年 或 ¥599/月' : '/yr or ¥599/mo'}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border last:border-b-0 ${
                        row.highlight
                          ? 'bg-accent/10'
                          : idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      }`}
                    >
                      <td className={`py-4 px-4 md:px-6 font-medium whitespace-nowrap align-middle ${row.highlight ? 'text-accent font-semibold' : 'text-primary'}`}>
                        {row.highlight && <span className="mr-1">🎁</span>}
                        {row.feature}
                      </td>
                      <td className={`py-4 px-4 text-center whitespace-nowrap align-middle ${row.highlight ? 'text-accent font-semibold' : 'text-muted-foreground'}`}>
                        {row.free}
                      </td>
                      <td className={`py-4 px-4 text-center whitespace-nowrap align-middle bg-accent/5 border-x-2 border-accent/20 ${row.highlight ? 'text-accent font-bold' : 'font-semibold text-accent'}`}>
                        {row.standard}
                      </td>
                      <td className={`py-4 px-4 text-center whitespace-nowrap align-middle ${row.highlight ? 'text-accent font-semibold' : 'text-muted-foreground'}`}>
                        {row.premium}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* CTA 行 */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="py-5 px-4 md:px-6" />
                    <td className="py-5 px-4 text-center">
                      <Link to="/auth/register">
                        <Button variant="outline" size="sm" className="w-full max-w-[120px]">
                          {lang === 'zh' ? '免费注册' : 'Sign Up'} →
                        </Button>
                      </Link>
                    </td>
                    <td className="py-5 px-4 text-center bg-accent/5 border-x-2 border-accent/20">
                      <Link to="/auth/register">
                        <Button size="sm" className="w-full max-w-[120px] bg-accent text-accent-foreground hover:bg-accent/90">
                          {lang === 'zh' ? '立即开通' : 'Get Started'} →
                        </Button>
                      </Link>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <Link to="/auth/register">
                        <Button size="sm" className="w-full max-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90">
                          {lang === 'zh' ? '升级高级' : 'Go Premium'} →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 升级路径 */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">
              {lang === 'zh' ? '升级路径说明' : 'Upgrade Path'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '随时升级，按需调整，到期前7天提醒' : 'Upgrade anytime, adjust as needed, 7-day renewal reminders'}
            </p>
          </div>

          {/* 路径步骤 */}
          <div className="flex flex-col gap-4">
            {upgradeSteps.map((step, i) => (
              <div key={i} className={`rounded-xl p-5 flex items-start gap-4 ${step.color}`}>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-primary text-base mb-1">{step.arrow}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 最终 CTA */}
          <div className="mt-12 flex justify-center">
            <Link to="/magic-mirror">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 font-semibold">
                {lang === 'zh' ? '🔮 开始魔镜筛查' : '🔮 Start Magic Mirror'}
              </Button>
            </Link>
          </div>

          {/* 平台定位说明 */}
          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            {lang === 'zh'
              ? '⚠️ 跨境家和是律师引荐平台，非直接法律服务机构。所有法律服务由平台合作的持牌律师提供。AI 回复仅供信息参考，不构成法律建议。'
              : '⚠️ CrossBorder JiaHe is a lawyer referral platform, not a direct legal services provider. All legal services are provided by our licensed attorney partners. AI responses are for informational purposes only and do not constitute legal advice.'}
          </p>
        </div>
      </section>
    </div>
  );
}
