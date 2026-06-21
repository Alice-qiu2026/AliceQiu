import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Heart, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { submitConsultation } from '@/services/api';

const lawyerNetwork = [
  { country: '中国', en: 'China' },
  { country: '加拿大', en: 'Canada' },
  { country: '美国', en: 'USA' },
  { country: '香港', en: 'Hong Kong' },
  { country: '新加坡', en: 'Singapore' },
  { country: '百慕大', en: 'Bermuda' },
];

const reasonIcons = [Shield, Globe, Lightbulb, Heart];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { user } = useAuth();
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 服务数据（通过 i18n key 驱动）
  const services = [
    {
      key: 'magicMirror',
      emoji: '🔮',
      tagKey: 'home.serviceMagicMirror.label',
      titleKey: 'home.serviceMagicMirror.title',
      sloganKey: 'home.serviceMagicMirror.slogan',
      descKey: 'home.serviceMagicMirror.desc',
      features: ['home.serviceMagicMirror.feature1', 'home.serviceMagicMirror.feature2', 'home.serviceMagicMirror.feature3', 'home.serviceMagicMirror.feature4'],
      ctaKey: 'home.serviceMagicMirror.cta',
      link: '/magic-mirror',
      imgSrc: 'https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260616/image_1781547920781.png',
    },
    {
      key: 'growthCamp',
      emoji: '🌱',
      tagKey: 'home.serviceGrowthCamp.label',
      titleKey: 'home.serviceGrowthCamp.title',
      sloganKey: 'home.serviceGrowthCamp.slogan',
      descKey: 'home.serviceGrowthCamp.desc',
      features: ['home.serviceGrowthCamp.feature1', 'home.serviceGrowthCamp.feature2', 'home.serviceGrowthCamp.feature3', 'home.serviceGrowthCamp.feature4'],
      ctaKey: 'home.serviceGrowthCamp.cta',
      link: '/growth-camp',
      imgSrc: 'https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260614/image_1781445971618.png',
    },
    {
      key: 'aiMediation',
      emoji: '🤝',
      tagKey: 'home.serviceAiMediation.label',
      titleKey: 'home.serviceAiMediation.title',
      sloganKey: null,
      descKey: 'home.serviceAiMediation.desc',
      features: ['home.serviceAiMediation.feature1', 'home.serviceAiMediation.feature2', 'home.serviceAiMediation.feature3', 'home.serviceAiMediation.feature4'],
      ctaKey: 'home.serviceAiMediation.cta',
      link: '/ai-mediation',
      imgSrc: 'https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260614/image_1781447092502.png',
    },
  ];

  // 案例数据
  const cases = [
    { titleKey: 'home.cases.case1Title', descKey: 'home.cases.case1Desc', tagKey: 'home.cases.case1Tag' },
    { titleKey: 'home.cases.case2Title', descKey: 'home.cases.case2Desc', tagKey: 'home.cases.case2Tag' },
    { titleKey: 'home.cases.case3Title', descKey: 'home.cases.case3Desc', tagKey: 'home.cases.case3Tag' },
  ];

  // 信任特性（已在 i18n home.trust.*)
  const trustFeatures = [
    { titleKey: 'home.trust.feature1Title', descKey: 'home.trust.feature1Desc' },
    { titleKey: 'home.trust.feature2Title', descKey: 'home.trust.feature2Desc' },
    { titleKey: 'home.trust.feature3Title', descKey: 'home.trust.feature3Desc' },
  ];

  // 为什么选择我们
  const reasons = [
    { iconIdx: 0, titleKey: 'home.whyUs.reason1Title', descKey: 'home.whyUs.reason1Desc' },
    { iconIdx: 1, titleKey: 'home.whyUs.reason2Title', descKey: 'home.whyUs.reason2Desc' },
    { iconIdx: 2, titleKey: 'home.whyUs.reason3Title', descKey: 'home.whyUs.reason3Desc' },
    { iconIdx: 3, titleKey: 'home.whyUs.reason4Title', descKey: 'home.whyUs.reason4Desc' },
  ];

  const interestOptions = currentLang === 'zh' ? [
    '魔镜 · 风险识别',
    '家和成长营 · 文化教育',
    '家和协商室 · 律师引荐',
    '安心认证 · 信任背书',
    '其他',
  ] : [
    'Magic Mirror · Risk Screening',
    'Growth Camp · Cultural Education',
    'JiaHe Mediation Room · Lawyer Referral',
    'Peace of Mind · Trust Badge',
    'Other',
  ];

  const toggleInterest = (opt: string) => {
    setInterests((prev) =>
      prev.includes(opt) ? prev.filter((i) => i !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async () => {
    if (interests.length === 0) {
      toast.error(t('home.contact.formValidation'));
      return;
    }
    setSubmitting(true);
    const ok = await submitConsultation({
      user_id: user?.id || null,
      name: '',
      email: '',
      phone: null,
      interests,
      message: null,
    });
    setSubmitting(false);
    if (ok) {
      toast.success(t('home.contact.formSuccess'));
      setInterests([]);
    } else {
      toast.error(t('home.contact.formError'));
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section id="hero-section" className="bg-primary text-primary-foreground py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* 左侧文案 */}
            <div className="flex-1 max-w-2xl space-y-6 text-center lg:text-left">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight text-balance">
                {t('home.hero.title')}
              </h1>
              <p className="text-base md:text-lg opacity-90 leading-relaxed text-pretty">
                {t('home.hero.subtitle')}
              </p>
            </div>

            {/* 右侧配图 */}
            <div className="flex-1 max-w-lg lg:max-w-md xl:max-w-lg w-full">
              <img
                src="https://miaoda-image.bj.bcebos.com/pixabay_round1/01/pixabay_880345_9232499.jpg"
                alt={currentLang === 'zh' ? '温暖的跨境家庭' : 'Warm cross-border family'}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* ── 数据统计卡片 ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { value: '25+', labelKey: 'home.stats.years' },
              { value: '2',   labelKey: 'home.stats.countries' },
              { value: '3',   labelKey: 'home.stats.products' },
              { value: '∞',  labelKey: 'home.stats.families' },
            ].map((stat) => (
              <div
                key={stat.labelKey}
                className="rounded-xl text-center py-5 px-4"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}
              >
                <p className="text-3xl md:text-4xl font-bold" style={{ color: '#D4AF37' }}>
                  {stat.value}
                </p>
                <p className="text-sm md:text-base opacity-90 mt-1 leading-snug">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 歌德名言 ── */}
      <section className="bg-secondary/30 py-10">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto bg-white/80 border-accent/20">
            <CardContent className="p-8 text-center">
              <p className="text-lg md:text-xl italic text-primary leading-relaxed">
                {t('home.goetheQuote')}
              </p>
              <p className="text-sm text-muted-foreground mt-3">{t('home.goetheAuthor')}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Our Mission ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6 text-balance">
            {t('home.mission.title')}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            {t('home.mission.desc')}
          </p>
        </div>
      </section>

      {/* ── Real Cases ── */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 text-balance">
              {t('home.cases.title')}
            </h2>
            <p className="text-muted-foreground text-pretty">
              {t('home.cases.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cases.map((c) => (
              <Card key={c.titleKey} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-primary mb-3 text-balance">{t(c.titleKey)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1 text-pretty">{t(c.descKey)}</p>
                  <Badge variant="secondary" className="mt-4 w-fit">
                    {t(c.tagKey)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/magic-mirror">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                {t('home.cases.cta')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Core Services ── */}
      <section id="services" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 text-balance">
              {t('home.services.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              {t('home.services.subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            {services.map((svc) => (
              <Card key={svc.key} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* 服务图片区域 */}
                    <div className="bg-primary text-primary-foreground flex items-center justify-center shrink-0 overflow-hidden md:w-64">
                      {svc.imgSrc ? (
                        <div className="w-full aspect-[4/3] md:aspect-auto md:h-full">
                          <img
                            src={svc.imgSrc}
                            alt={t(svc.titleKey)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-5xl p-8">{svc.emoji}</span>
                      )}
                    </div>

                    {/* 服务内容 */}
                    <div className="p-6 md:p-8 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {svc.emoji} {t(svc.tagKey)}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-primary mb-1">{t(svc.titleKey)}</h3>

                      {svc.sloganKey && (
                        <p className="text-accent font-medium text-sm mb-3">{t(svc.sloganKey)}</p>
                      )}
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 text-pretty">{t(svc.descKey)}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {svc.features.map((fk) => (
                          <div key={fk} className="flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                            {t(fk)}
                          </div>
                        ))}
                      </div>

                      <Link to={svc.link}>
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                          {t(svc.ctaKey)}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 引荐平台信任体系 ── */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 text-balance">
              {t('home.trust.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              {t('home.trust.subtitle')}
            </p>
          </div>

          {/* 六地律师网络 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12 max-w-4xl mx-auto">
            {lawyerNetwork.map((loc) => (
              <div key={loc.en} className="text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-primary">{currentLang === 'zh' ? loc.country : loc.en}</p>
              </div>
            ))}
          </div>

          {/* 三大信任保障 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {trustFeatures.map((tf) => (
              <Card key={tf.titleKey} className="h-full">
                <CardContent className="p-6 text-center">
                  <Shield className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-bold text-primary mb-2">{t(tf.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground text-pretty">{t(tf.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Founder ── */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">{t('home.aboutFounder.title')}</h2>
            <p className="text-muted-foreground mt-1">{t('home.aboutFounder.subtitle')}</p>
          </div>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-center mb-6">
                <img
                  src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260616/image_1781547718102.png"
                  alt="Attorney Alice Qiu — Founder of CrossBorder JiaHe"
                  className="w-40 h-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap">
                <span className="text-accent">❤</span>
                {['tag1', 'tag2', 'tag3', 'tag4', 'tag5'].map((tag, i, arr) => (
                  <span key={tag}>
                    {t(`home.aboutFounder.${tag}`)}
                    {i < arr.length - 1 && <span className="text-border mx-1">/</span>}
                  </span>
                ))}
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                {['bio1', 'bio2', 'bio3'].map((bio) => (
                  <p key={bio}>{t(`home.aboutFounder.${bio}`)}</p>
                ))}
                <p className="italic text-primary font-medium">{t('home.aboutFounder.bio4')}</p>
              </div>

              <div className="mt-6 text-center">
                <Link to="/about">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    {currentLang === 'zh' ? '了解引荐平台定位' : 'Learn About Our Platform'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12 text-balance">
            {t('home.whyUs.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {reasons.map((r) => {
              const Icon = reasonIcons[r.iconIdx];
              return (
                <Card key={r.titleKey} className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-primary mb-2">{t(r.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground text-pretty">{t(r.descKey)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 text-balance">
              {currentLang === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentLang === 'zh' ? '关于平台、服务与隐私保护' : 'About the platform, services, and privacy'}
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: '跨境家和是律师事务所吗？', qEn: 'Is CrossBorder JiaHe a law firm?',
                a: '跨境家和是律师引荐平台，我们连接您与持牌专业律师。所有入驻律师均经过资质审核，我们不直接提供法律服务。', aEn: 'CrossBorder JiaHe is a lawyer referral platform connecting you with licensed professionals. We do not directly provide legal services.',
              },
              {
                q: '魔镜报告是法律意见吗？', qEn: 'Is the Magic Mirror report legal advice?',
                a: '魔镜报告是AI风险筛查工具，提供信息参考，不构成法律建议。个案咨询请通过平台预约持牌律师。', aEn: 'The Magic Mirror report is an AI risk screening tool providing informational reference only. It does not constitute legal advice.',
              },
              {
                q: '如何保护我的隐私？', qEn: 'How is my privacy protected?',
                a: '我们承诺全程匿名隐私保护，您的信息严格保密，仅用于提供服务，不会向第三方分享。', aEn: 'We commit to full anonymity and privacy protection. Your information is strictly confidential and never shared with third parties.',
              },
              {
                q: '魔镜报告需要多久生成？', qEn: 'How long does the Magic Mirror report take?',
                a: '通常3分钟内生成报告，最长不超过5分钟。', aEn: 'Reports are typically generated within 3 minutes, up to 5 minutes at most.',
              },
              {
                q: '如何联系持牌律师？', qEn: 'How do I contact a licensed attorney?',
                a: '您可以通过家和协商室预约咨询，我们会根据您的需求智能匹配合适的持牌律师。', aEn: 'You can book a consultation through JiaHe Mediation Room, and we will intelligently match you with a suitable licensed attorney.',
              },
              {
                q: 'AI助手能提供法律建议吗？', qEn: 'Can the AI assistant provide legal advice?',
                a: 'AI助手仅提供信息参考，不做法律判断。涉及具体法律问题时，我们会引导您预约持牌律师。', aEn: 'The AI assistant provides informational guidance only and does not make legal judgments. For specific legal matters, we will guide you to book a licensed attorney.',
              },
              {
                q: '魔镜和安心认证有什么区别？', qEn: 'What is the difference between Magic Mirror and Peace of Mind Certification?',
                a: '魔镜是由第三方发起的他人风险筛查工具；安心认证是由当事人主动申请的透明度认证，获得蓝标后在被他人魔镜筛查时风险等级自动降低。', aEn: 'Magic Mirror is a third-party risk screening tool; Peace of Mind Certification is a voluntary transparency program. Certified users receive a blue badge and their risk rating automatically improves when others run Magic Mirror on them.',
              },
            ].map((item, idx) => (
              <Card key={idx} className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-bold text-primary text-sm mb-2">
                    {currentLang === 'zh' ? item.q : item.qEn}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    {currentLang === 'zh' ? item.a : item.aEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 底部转化 CTA ── */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">
            {currentLang === 'zh' ? '立即守护您的跨境家庭' : 'Start Protecting Your Family Today'}
          </h2>
          <p className="opacity-80 mb-8 max-w-xl mx-auto text-pretty">
            {currentLang === 'zh'
              ? '从魔镜风险筛查开始，3分钟了解潜在风险。我们是引荐平台，非直接法律服务机构。'
              : 'Start with Magic Mirror — get a risk report in 3 minutes. We are a referral platform, not a direct legal services provider.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* 首要 CTA */}
            <Link to="/magic-mirror">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 font-bold text-base w-full sm:w-auto">
                🔮 {currentLang === 'zh' ? '开始魔镜筛查' : 'Start Magic Mirror Screening'}
              </Button>
            </Link>
            <Link to="/join">
              <Button
                size="lg"
                variant="ghost"
                className="border-2 border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10 px-8 h-12 font-semibold w-full sm:w-auto"
              >
                💎 {currentLang === 'zh' ? '查看会员权益' : 'View Membership Benefits'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact Us ── */}
      <section id="contact" className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3 text-balance">
              {t('home.contact.title')}
            </h2>
            <p className="text-muted-foreground text-pretty">
              {t('home.contact.subtitle')}
            </p>
          </div>

          {/* 联系方式卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">📧 {t('home.contact.email')}</p>
                <p className="font-medium text-primary text-sm">info@crossborderjiahe.com</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">💬 {currentLang === 'zh' ? '微信' : 'WeChat'}</p>
                <p className="font-medium text-primary text-sm">JiaHe2025</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">📞 {t('home.contact.phone')}</p>
                <p className="font-medium text-primary text-sm">{t('home.contact.phoneNote')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">🌍 {t('home.contact.area')}</p>
                <p className="font-medium text-primary text-sm">{t('home.contact.areaCanada')} · {t('home.contact.areaChina')}</p>
              </CardContent>
            </Card>
          </div>

          {/* 紧急提示 */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center mb-8">
            <p className="text-destructive font-medium text-sm">
              ⚠️ {t('home.contact.emergency')}
            </p>
          </div>

          {/* 咨询表单 */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-primary mb-4">{t('home.contact.formTitle')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {interestOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors min-h-12 ${
                      interests.includes(opt)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={interests.includes(opt)}
                      onChange={() => toggleInterest(opt)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {submitting ? `${t('common.submitting')}...` : t('home.contact.formTitle')}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                {currentLang === 'zh'
                  ? '⚠️ 跨境家和为律师引荐平台，非直接法律服务机构'
                  : '⚠️ CrossBorder JiaHe is a lawyer referral platform, not a direct legal services provider'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}