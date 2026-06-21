import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Heart, Lightbulb, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const activities = [
  {
    icon: BookOpen,
    title: '线下读书会',
    desc: '定期组织家庭法律文化主题读书分享，在轻松氛围中学习加拿大家庭法律常识',
    frequency: '每月1次',
  },
  {
    icon: Users,
    title: '真实案例分享',
    desc: ' anonymized 真实案例讨论，帮助参与者理解法律文化差异带来的实际影响',
    frequency: '每季度2次',
  },
  {
    icon: Lightbulb,
    title: '法律文化工作坊',
    desc: '互动式工作坊，深入探讨中加家庭法律文化差异，提供实用应对策略',
    frequency: '每季度1次',
  },
  {
    icon: Heart,
    title: '社群支持网络',
    desc: '建立跨境家庭互助社群，分享经验、相互支持，共同成长',
    frequency: '持续在线',
  },
];

export default function GrowthCampPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260614/image_1781445971618.png"
              alt="家和成长营"
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            🌱 家和成长营
          </h1>
          <p className="text-accent font-medium text-lg mb-4">
            Grow Together
          </p>
          <p className="text-sm opacity-90 max-w-2xl mx-auto">
            以线下读书会和真实案例分享为主的文化教育项目。在轻松的社群氛围中，了解加拿大家庭法律，结交同路人，共同成长。
          </p>
        </div>
      </section>

      {/* Slogan */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl md:text-2xl font-medium text-primary italic">
            Stories · Connection · Growth
          </p>
          <p className="text-muted-foreground mt-2">
            Stronger Families, Brighter Futures
          </p>
        </div>
      </section>

      {/* 活动介绍 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              核心活动
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              四大活动板块，全方位支持您的跨境家庭成长之旅
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {activities.map((act) => (
              <Card key={act.title} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <act.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-primary">{act.title}</h3>
                      <Badge variant="secondary" className="text-xs">{act.frequency}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {act.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 价值观 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              我们的价值观
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Love', desc: '以爱为出发点，关注家庭和谐' },
              { title: 'Listen', desc: '倾听每个家庭独特的故事' },
              { title: 'Lift', desc: '相互扶持，共同成长' },
            ].map((v) => (
              <Card key={v.title} className="text-center">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-accent mb-2">{v.title}</h3>
                  <p className="text-muted-foreground text-sm">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            加入我们，一起成长
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            无论您是刚刚踏上移民之路，还是已在加拿大生活多年，家和成长营都欢迎您的加入。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? '/member' : '/auth/login'}>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Calendar className="w-4 h-4 mr-2" />
                {t('growthCamp.joinBtn')}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('growthCamp.backHome')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
