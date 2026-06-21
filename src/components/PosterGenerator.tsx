import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Loader2, Image, Share2, MessageCircle, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PosterGeneratorProps {
  inviteCode: string;
}

// 检测是否在微信浏览器内
function isWechatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

interface SharePlatform {
  name: string;
  key: string;
  icon: string;
  color: string;
  buildUrl?: (text: string, url: string) => string;
}

const sharePlatforms: SharePlatform[] = [
  {
    name: '微信朋友圈',
    key: 'wechat-moments',
    icon: '📱',
    color: '#07C160',
  },
  {
    name: '微信好友',
    key: 'wechat-friend',
    icon: '💬',
    color: '#07C160',
  },
  {
    name: 'X (Twitter)',
    key: 'twitter',
    icon: '𝕏',
    color: '#000000',
    buildUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: '微博',
    key: 'weibo',
    icon: '📢',
    color: '#E6162D',
    buildUrl: (text, url) => `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    key: 'linkedin',
    icon: 'in',
    color: '#0A66C2',
    buildUrl: (_text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'QQ',
    key: 'qq',
    icon: '🐧',
    color: '#12B7F5',
    buildUrl: (text, url) => `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: '小红书',
    key: 'xiaohongshu',
    icon: '📕',
    color: '#FF2442',
  },
  {
    name: 'Instagram',
    key: 'instagram',
    icon: '📷',
    color: '#E4405F',
  },
];

export default function PosterGenerator({ inviteCode }: PosterGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showWechatGuide, setShowWechatGuide] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const shareText = `我在用跨境家和的魔镜AI筛查工具，帮您识别跨境婚恋/合作中的风险。使用我的邀请码「${inviteCode}」注册，双方均可获得奖励！`;
  const shareUrl = `${window.location.origin}/auth/register?ref=${inviteCode}`;

  const generateQRCode = useCallback(async (text: string): Promise<string> => {
    const QRCode = await import('qrcode');
    return QRCode.toDataURL(text, { width: 200, margin: 2 });
  }, []);

  const handleGenerate = async () => {
    setOpen(true);
    if (posterUrl) return;

    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const qrDataUrl = await generateQRCode(`${window.location.origin}/auth/register?ref=${inviteCode}`);

      // 创建离屏 DOM 用于渲染海报
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '375px';
      document.body.appendChild(container);

      // 海报 HTML
      container.innerHTML = `
        <div id="poster-canvas" style="width: 375px; height: 667px; background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%); position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden;">
          <div style="position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
          <div style="position: absolute; top: 120px; left: -40px; width: 120px; height: 120px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
          
          <div style="padding: 48px 32px 24px; text-align: center;">
            <div style="font-size: 36px; margin-bottom: 12px;">🏠</div>
            <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">跨境家和</h1>
            <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 6px;">守护华人家庭的法律安全</p>
          </div>

          <div style="width: 60px; height: 3px; background: #e9a319; margin: 0 auto 24px; border-radius: 2px;"></div>

          <div style="padding: 0 32px; text-align: center;">
            <p style="color: #e9a319; font-size: 18px; font-weight: bold; margin: 0 0 8px;">🪞 魔镜 AI 风险筛查</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              识别跨境婚恋/合作中的潜在风险<br>
              为您的家庭保驾护航
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(233,163,25,0.3); border-radius: 12px; margin: 0 32px 24px; padding: 16px; text-align: center;">
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 8px;">扫码注册 双方获得奖励</p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="color: rgba(255,255,255,0.5); font-size: 13px;">邀请码</span>
              <span style="color: #e9a319; font-size: 22px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">${inviteCode}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <div style="background: #ffffff; padding: 8px; border-radius: 12px; display: inline-block;">
              <img src="${qrDataUrl}" style="width: 160px; height: 160px; display: block;" />
            </div>
            <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 10px;">长按识别二维码 · 立即体验</p>
          </div>

          <div style="position: absolute; bottom: 20px; left: 0; right: 0; text-align: center;">
            <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">跨境家和 · 让跨境家庭更安心</p>
          </div>
        </div>
      `;

      await new Promise((r) => setTimeout(r, 300));
      const canvas = await html2canvas(document.getElementById('poster-canvas')!, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setPosterUrl(dataUrl);
      document.body.removeChild(container);
    } catch (err: any) {
      toast.error('海报生成失败：' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!posterUrl) return;
    const link = document.createElement('a');
    link.download = `跨境家和-邀请海报-${inviteCode}.png`;
    link.href = posterUrl;
    link.click();
    toast.success('海报已保存到相册');
  };

  const handleSharePlatform = (platform: SharePlatform) => {
    if (platform.key === 'wechat-moments' || platform.key === 'wechat-friend') {
      if (isWechatBrowser()) {
        toast.info('请长按海报图片保存到相册，然后在微信中分享');
      } else {
        handleDownload();
        setShowWechatGuide(true);
      }
      return;
    }

    // 小红书、Instagram 需要复制文案
    if (platform.key === 'xiaohongshu' || platform.key === 'instagram') {
      const fullText = `${shareText}\n\n注册链接：${shareUrl}`;
      navigator.clipboard.writeText(fullText);
      toast.success(`文案已复制，请打开${platform.name}粘贴发布`);
      return;
    }

    // 有分享 URL 的平台
    if (platform.buildUrl) {
      const url = platform.buildUrl(shareText, shareUrl);
      window.open(url, '_blank', 'width=600,height=500');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="shrink-0 border-primary text-primary hover:bg-primary/10"
        onClick={handleGenerate}
      >
        <Image className="w-4 h-4 mr-1" />
        生成海报
      </Button>

      {/* 海报预览弹窗 */}
      <Dialog open={open && !showSharePanel && !showWechatGuide} onOpenChange={(v) => { setOpen(v); if (!v) { setShowSharePanel(false); setShowWechatGuide(false); } }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-center">我的推广海报</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex flex-col items-center gap-4">
            {generating ? (
              <div className="w-full h-[400px] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">正在生成海报...</p>
              </div>
            ) : posterUrl ? (
              <>
                <div className="rounded-lg overflow-hidden shadow-lg border">
                  <img src={posterUrl} alt="推广海报" className="w-full max-w-[300px]" />
                </div>
                <div className="flex gap-2 w-full">
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    保存图片
                  </Button>
                  <Button onClick={() => setShowSharePanel(true)} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Share2 className="w-4 h-4 mr-1" />
                    多平台分享
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">生成失败，请重试</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 多平台分享面板 */}
      <Dialog open={showSharePanel} onOpenChange={setShowSharePanel}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">分享到社交平台</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 文案区域 */}
            <div className="bg-muted rounded-lg p-3 relative">
              <p className="text-sm text-muted-foreground leading-relaxed">{shareText}</p>
              <p className="text-sm text-primary mt-1">{shareUrl}</p>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 px-2"
                onClick={() => {
                  navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                  toast.success('文案已复制');
                }}
              >
                {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>

            {/* 平台网格 */}
            <div className="grid grid-cols-4 gap-3">
              {sharePlatforms.map((platform) => (
                <button
                  key={platform.key}
                  onClick={() => handleSharePlatform(platform)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: platform.color + '15' }}
                  >
                    <span style={{ color: platform.color }}>{platform.icon}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{platform.name}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              点击平台图标即可分享，部分平台需先保存图片
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 微信分享引导弹窗 */}
      <Dialog open={showWechatGuide} onOpenChange={setShowWechatGuide}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">分享到微信</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <p className="text-sm text-left">海报已保存到相册</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <p className="text-sm text-left">打开微信，进入朋友圈或好友聊天</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#07C160] text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <p className="text-sm text-left">从相册选择海报图片发送</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              好友扫码注册并购买后，您将获得 5 次免费初筛报告
            </p>
            <Button onClick={() => setShowWechatGuide(false)} className="w-full">
              知道了
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
