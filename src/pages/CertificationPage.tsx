import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldPlus, Check, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const certLevels = [
  {
    name: '基础认证',
    price: '¥699',
    unit: '/次',
    member: '免费会员',
    badge: '🔵',
    icon: Shield,
    color: '#3498db',
    badgeBg: 'bg-blue-50',
    border: 'border-blue-200',
    features: [
      '蓝色基础徽章',
      '魔镜报告轻度加权',
      '社区轻度优先展示',
    ],
    tag: '',
  },
  {
    name: '标准认证',
    price: '¥399',
    unit: '/次',
    member: '普通会员',
    badge: '🔷',
    icon: ShieldCheck,
    color: '#2980b9',
    badgeBg: 'bg-sky-50',
    border: 'border-sky-300',
    features: [
      '亮蓝徽章（高亮显示）',
      '魔镜报告加权',
      '活动优先报名',
      '社区置顶展示',
      '专属审核通道',
    ],
    tag: '最受欢迎',
  },
  {
    name: '金牌认证',
    price: '免费',
    unit: '1次/会员期',
    member: '高级会员',
    badge: '🏅',
    icon: ShieldPlus,
    color: '#D4AF37',
    badgeBg: 'bg-amber-50',
    border: 'border-amber-300',
    features: [
      '深蓝金边徽章（最高级别）',
      '魔镜报告最高权重',
      '专属活动邀请',
      '专业服务折扣',
      '年度安心之星评选资格',
    ],
    tag: '高级会员专属',
  },
];

const flowSteps = [
  { icon: '📝', title: '申请提交', desc: '上传材料，填写问卷', time: '' },
  { icon: '🤖', title: 'AI初审', desc: '材料验证与交叉核实', time: '10-60分钟' },
  { icon: '👨‍⚖️', title: '人工复核', desc: '邱律团队最终审核', time: '1-3个工作日' },
  { icon: '🎉', title: '颁发展示', desc: '数字证书 + 蓝标点亮', time: '' },
];

export default function CertificationPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            🔐 安心认证 Peace of Mind Certification
          </h1>
          <p className="text-accent text-lg md:text-xl font-medium mb-4">
            "我主动披露，让爱更安心"
          </p>
          <p className="text-sm md:text-base opacity-90 max-w-2xl mx-auto leading-relaxed">
            {t('certification.desc')}
          </p>
        </div>
      </section>

      {/* 正义女神图片区 */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
            <div className="w-64 h-80 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-xl shrink-0">
              <img
                src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260615/image_1781468176930.png"
                alt={t('certification.title')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-primary mb-3">
                从"被动防风险"到"主动建信任"
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('certification.title')}是跨境家和平台的核心信任机制。让愿意以真诚方式建立关系的用户，在平台内外都获得荣誉感和优先机会。
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-1 text-sm text-primary">
                  <BadgeCheck className="w-4 h-4" />
                  <span>魔镜加权</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary">
                  <BadgeCheck className="w-4 h-4" />
                  <span>社区优先</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary">
                  <BadgeCheck className="w-4 h-4" />
                  <span>活动优先</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 认证等级 */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              选择您的认证等级
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              不同认证等级对应不同审核强度和专属权益
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {certLevels.map((level) => (
              <Card
                key={level.name}
                className={`relative h-full flex flex-col ${level.border} border-2 hover:shadow-lg transition-shadow`}
              >
                {level.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full text-white ${
                        level.name === '金牌认证' ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                    >
                      {level.tag}
                    </span>
                  </div>
                )}
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{level.badge}</div>
                    <h3 className="text-lg font-bold text-primary">{level.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">适用：{level.member}</p>
                    <div className="mt-3">
                      <span className="text-2xl font-bold" style={{ color: level.color }}>
                        {level.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{level.unit}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">
                      审核：AI初审 + 人工复核 · 有效期12个月
                    </p>
                    <ul className="space-y-2">
                      {level.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: level.color }} />
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <Link to={`/certification/apply?level=${level.name === '基础认证' ? 'basic' : level.name === '标准认证' ? 'standard' : 'gold'}`}>
                      <Button className="w-full" style={{ backgroundColor: level.color, color: '#fff' }}>
                        {t('certification.applyBtn')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 认证流程 */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              认证流程
            </h2>
            <p className="text-muted-foreground">4步完成闭环，快速获得蓝标认证</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {flowSteps.map((step, idx) => (
              <div key={step.title} className="relative">
                {idx < flowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <div className="bg-card rounded-xl p-5 text-center border border-border shadow-sm">
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <h4 className="font-bold text-primary text-sm mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                  {step.time && (
                    <p className="text-xs text-accent mt-1 font-medium">{step.time}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 蓝标显示规则 */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              蓝标显示规则
            </h2>
            <p className="text-muted-foreground">全平台统一的蓝标展示，让您获得优先关注</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '👤', title: '头像徽章', desc: '头像右上角蓝色信任徽章，带"安心认证"小字' },
              { icon: '🔍', title: '魔镜加权', desc: '被筛查时风险等级自动降低，报告标注已认证' },
              { icon: '🏆', title: '社区优先', desc: '互动、匹配列表中优先展示/高亮，线下专属席位' },
            ].map((item) => (
              <Card key={item.title} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-primary mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 魔镜联动 */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-xl md:text-2xl font-bold mb-4">魔镜联动 · 信任升级</h2>
          <p className="opacity-90 leading-relaxed mb-6">
            持有安心认证的用户被他人魔镜筛查时，报告中会突出显示"已通过平台安心认证"，
            相关风险等级自动降低一级。蓝标用户信息具有更高可信度。
          </p>
          <Link to="/magic-mirror">
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
              了解魔镜筛查
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
