import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Globe, Shield, CheckCircle2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const lawyerNetwork = [
  { zh: '中国', en: 'China', flag: '🇨🇳' },
  { zh: '加拿大', en: 'Canada', flag: '🇨🇦' },
  { zh: '美国', en: 'USA', flag: '🇺🇸' },
  { zh: '香港', en: 'Hong Kong', flag: '🇭🇰' },
  { zh: '新加坡', en: 'Singapore', flag: '🇸🇬' },
  { zh: '百慕大', en: 'Bermuda', flag: '🏝️' },
];

const reviewSteps = {
  zh: [
    { step: '资质初审', desc: '核实律师执照、执业资格与执业地区' },
    { step: '背景调查', desc: '查验执业记录、投诉历史与客户评价' },
    { step: '专项匹配', desc: '确认专业领域与跨境家庭业务经验' },
    { step: '持续监督', desc: '定期复核资质，确保持续合规' },
  ],
  en: [
    { step: 'Credential Review', desc: 'Verify law license, practice qualifications, and jurisdictions' },
    { step: 'Background Check', desc: 'Review practice history, complaint records, and client feedback' },
    { step: 'Specialty Matching', desc: 'Confirm expertise in cross-border family law matters' },
    { step: 'Ongoing Oversight', desc: 'Periodic re-verification to ensure continuous compliance' },
  ],
};

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const tags = lang === 'zh'
    ? ['引荐平台创始人', '跨境家庭法律专家', '25年跨国业务经验', '美加双执照理财顾问']
    : ['Referral Platform Founder', 'Cross-Border Family Law Expert', '25+ Yrs Cross-Border Practice', 'US & Canada Licensed Advisor'];

  const steps = lang === 'zh' ? reviewSteps.zh : reviewSteps.en;

  return (
    <div className="min-h-screen bg-background">

      {/* 顶部 Hero */}
      <section className="pt-12 pb-10 md:pt-16 md:pb-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-1 text-sm font-semibold">
            {lang === 'zh' ? '引荐平台 · 非直接法律服务机构' : 'Referral Platform · Not a Direct Legal Services Provider'}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-balance">
            Attorney Alice Qiu
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Founder of CrossBorder JiaHe
          </p>

          {/* 头像 */}
          <div className="flex justify-center mb-6">
            <img
              src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260615/image_1781486537487.png"
              alt="Attorney Alice Qiu — Founder of CrossBorder JiaHe"
              className="w-32 h-auto md:w-40 object-contain"
            />
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <Heart className="w-4 h-4 text-accent shrink-0" />
            {tags.map((tag, i) => (
              <span key={i} className="text-sm opacity-90">
                {tag}{i < tags.length - 1 && <span className="opacity-40 mx-1">/</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 个人经历正文 */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {lang === 'zh' ? (
            <div className="space-y-6 text-foreground leading-relaxed text-base">
              <p>
                1998年，邱律取得中国律师执照，加入
                <a href="https://www.deheheng.com/jigou/59.html" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">北京德和衡律师事务所</a>
                ——一家综合排名前十、拥有逾千名执业律师、在国内30个城市设有办公室的大型律师事务所，长期深耕跨国投资与婚姻家事业务。
              </p>
              <p>
                2005年与家人定居加拿大后，邱律专门为国内同事来加拿大投资或处理婚姻家事争议，在各省联络专业律师。在此过程中，她发现许多跨境家庭的纠纷仅靠法律手段难以彻底解决，为此相继取得了美国与加拿大的理财顾问牌照，提供法律+金融综合支持。
              </p>
              <p>
                多年来，邱律亲眼目睹了无数本可避免的家庭悲剧：夫妻因大声争吵被追究刑事责任、母亲因帮孩子做作业失去监护权、老人因不了解加拿大法律而家庭关系破裂……这些经历让她决心创立跨境家和，用教育与陪伴守护每一个跨境家庭。
              </p>
              <blockquote className="border-l-4 border-accent pl-5 py-2 my-8 italic text-muted-foreground">
                "无论是国王还是农夫，家庭和睦是最幸福的。"——这句话是我创立跨境家和的初心。
              </blockquote>
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">
                ⚠️ <strong>平台定位说明：</strong>跨境家和是律师引荐平台，明确标注为引荐平台，非直接法律服务机构。所有法律服务由平台合作的持牌律师独立提供，平台负责资质审核、匹配推荐与持续监督。
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-foreground leading-relaxed text-base">
              <p>
                In 1998, Alice Qiu obtained her Chinese law license and joined
                <a href="https://www.deheheng.com/jigou/59.html" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium ml-1">DeHeng Law Offices</a>
                — one of China's top-ten law firms with over a thousand attorneys and offices in 30 cities — where she specialized in cross-border investment and family law.
              </p>
              <p>
                After relocating to Canada in 2005, Alice coordinated professional legal services across provinces for Chinese families navigating Canadian investment and family disputes. She discovered that many cross-border divorce and inheritance cases required integrating legal, insurance, and financial tools — leading her to obtain both US and Canadian financial advisor licenses.
              </p>
              <p>
                Over the years, Alice witnessed countless preventable family tragedies: husbands charged with crimes after loud arguments, mothers losing custody for helping with homework, elderly parents severing family ties over misunderstood Canadian support laws. These experiences inspired her to found CrossBorder JiaHe — using education and companionship to protect every cross-border family.
              </p>
              <blockquote className="border-l-4 border-accent pl-5 py-2 my-8 italic text-muted-foreground">
                "Whether king or peasant, a harmonious family is the greatest happiness." — This is the heart of why I founded CrossBorder JiaHe.
              </blockquote>
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">
                ⚠️ <strong>Platform Note:</strong> CrossBorder JiaHe is a lawyer referral platform, not a direct legal services provider. All legal services are provided independently by our licensed attorney partners. We handle credential verification, matching, and ongoing oversight.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 六地持牌律师网络 */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">
              {lang === 'zh' ? '六地持牌律师网络' : 'Six-Jurisdiction Licensed Attorney Network'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lang === 'zh'
                ? '跨境家和合作律师覆盖以下地区，所有律师均持有当地执业资质'
                : 'CrossBorder JiaHe partners with licensed attorneys across these jurisdictions'}
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-10">
            {lawyerNetwork.map((loc) => (
              <div key={loc.en} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-2xl">
                  {loc.flag}
                </div>
                <p className="text-sm font-medium text-primary">{lang === 'zh' ? loc.zh : loc.en}</p>
              </div>
            ))}
          </div>

          {/* 家和审核流程 */}
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-primary mb-2">
              {lang === 'zh' ? '家和审核流程' : 'JiaHe Review Process'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {lang === 'zh' ? '所有入驻律师须通过四步严格审核' : 'All attorneys must pass our four-step verification'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <Card key={i} className="h-full">
                <CardContent className="p-5 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-bold text-primary text-sm mb-1">{s.step}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 联系入口 */}
      <section className="py-12 md:py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-3">
            {lang === 'zh' ? '预约律师引荐服务' : 'Book a Lawyer Referral'}
          </h2>
          <p className="opacity-80 mb-8 text-sm leading-relaxed">
            {lang === 'zh'
              ? '告诉我们您的需求，家和团队将为您匹配最合适的持牌律师'
              : 'Tell us your needs and our team will match you with the most suitable licensed attorney'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-accent" />
              <span>info@crossborderjiahe.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-accent" />
              <span>{lang === 'zh' ? '微信: JiaHe2025' : 'WeChat: JiaHe2025'}</span>
            </div>
          </div>
          <Link to="/#contact">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-11 font-semibold">
              {lang === 'zh' ? '立即预约咨询' : 'Book a Consultation'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
