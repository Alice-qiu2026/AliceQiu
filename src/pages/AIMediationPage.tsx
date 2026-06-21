import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FairyAvatar from '@/components/FairyAvatar';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type MediationMode = 'single' | 'dual';

export default function AIMediationPage() {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<MediationMode | null>(null);

  const navigate = useNavigate();

  const handleStart = () => {
    if (!selectedMode) {
      toast.error('请先选择调解模式');
      return;
    }
    navigate(`/ai-mediation/chat?mode=${selectedMode}`);
  };

  const handleShareLink = () => {
    const text = '我在用跨境家和的家和协商室，帮我匹配专业律师、化解家庭矛盾。推荐你也试试！';
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: '跨境家和·家和协商室', text, url });
    } else {
      navigator.clipboard.writeText(text + ' ' + url);
      toast.success('分享文案已复制');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F5]">
      <div className="container mx-auto px-4 max-w-2xl py-10">
        {/* 顶部头像与标题 */}
        <div className="text-center mb-8">
          <FairyAvatar size="lg" variant="pink" className="mx-auto mb-4 animate-fairy-float" />
          <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2">AI 调解</h1>
          <p className="text-[#888] text-base">
            由蓝仙女 AI 陪伴，帮助您倾诉、理解与和解
          </p>
        </div>

        {/* 选择调解模式 */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-[#2D2D2D] mb-1">请选择调解模式</h2>
          <p className="text-sm text-[#999]">
            无论是独自倾诉，还是双方调解，蓝仙女都在这里陪伴您
          </p>
        </div>

        {/* 模式卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedMode('single')}
            className={`text-left rounded-2xl border-2 p-5 transition-all ${
              selectedMode === 'single'
                ? 'border-[#F4A4A4] bg-white shadow-md'
                : 'border-[#E8E8E8] bg-white hover:border-[#D0D0D0]'
            }`}
          >
            <div className="text-2xl mb-3">🌸</div>
            <h3 className="text-base font-bold text-[#2D2D2D] mb-1">单人倾诉</h3>
            <p className="text-sm text-[#888] leading-relaxed">
              向蓝仙女倾诉您的困扰，获得情感支持与法律指引
            </p>
          </button>

          <button
            onClick={() => setSelectedMode('dual')}
            className={`text-left rounded-2xl border-2 p-5 transition-all ${
              selectedMode === 'dual'
                ? 'border-[#F4A4A4] bg-white shadow-md'
                : 'border-[#E8E8E8] bg-white hover:border-[#D0D0D0]'
            }`}
          >
            <div className="text-2xl mb-3">🤝</div>
            <h3 className="text-base font-bold text-[#2D2D2D] mb-1">双人调解</h3>
            <p className="text-sm text-[#888] leading-relaxed">
              邀请对方一起参与，由 AI 协助双方沟通与理解
            </p>
          </button>
        </div>

        {/* 开始调解按钮 */}
        <Button
          onClick={handleStart}
          className="w-full h-12 rounded-full text-base font-bold bg-[#F08080] hover:bg-[#E06E6E] text-white shadow-md mb-6"
        >
          开始调解
        </Button>

        {/* 免责声明 */}
        <p className="text-xs text-[#AAA] text-center leading-relaxed mb-8">
          AI 调解提供情感支持与法律信息，不构成正式法律意见，不替代专业法律或心理服务。如遇紧急情况请拨打 911。
        </p>

        {/* 分享奖励卡片 */}
        <Card className="border-[#F4A4A4]/40 bg-[#FFF0F0] rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#E05050] mb-1 flex items-center gap-1">
                  <span>🎁</span>
                  邀请朋友奖励
                </h4>
                <p className="text-sm text-[#888] leading-relaxed">
                  每成功邀请 1 位付费会员：免费会员获得 <strong>+5 份魔镜报告</strong>；普通/高级会员可<strong>延长 1 个月</strong>会员资格。
                </p>
                <Link to="/membership" className="inline-block mt-1.5 text-xs text-[#E05050] underline underline-offset-2 hover:opacity-80">
                  查看完整会员权益 →
                </Link>
              </div>
              <Button
                onClick={handleShareLink}
                className="shrink-0 rounded-full bg-[#E05050] hover:bg-[#C04040] text-white px-5 h-9 text-sm font-medium"
              >
                {t("aiMediation.shareBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
