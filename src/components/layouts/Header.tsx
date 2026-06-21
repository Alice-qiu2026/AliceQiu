import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogIn, LogOut, User, Sparkles, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const navLinks = [
  { labelKey: 'nav.home', path: '/' },
  { labelKey: 'nav.magicMirror', path: '/magic-mirror' },
  { labelKey: 'nav.membership', path: '/join' },
  { labelKey: 'nav.growthCamp', path: '/growth-camp' },
  { labelKey: 'nav.aiMediation', path: '/ai-mediation' },
  { labelKey: 'nav.certification', path: '/certification' },
  { labelKey: 'nav.about', path: '/about' },
  { labelKey: 'nav.contact', path: '/#contact' },
];

function RoofIcon({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const leftBase = x;
  const rightBase = x + w;
  const ridgeX = x + w * 0.42;
  const top = y;
  const base = y + h;
  const color = '#C59A3F';

  // 右侧水平瓦片线（三角屋顶右半填充）
  const tiles = [];
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const ly = top + (base - top) * t * 0.92;
    const lx1 = ridgeX + (rightBase - ridgeX) * t * 0.18;
    const lx2 = rightBase - (rightBase - ridgeX) * (1 - t) * 0.08;
    tiles.push(
      <line
        key={i}
        x1={lx1}
        y1={ly}
        x2={lx2}
        y2={ly}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    );
  }

  return (
    <g>
      {/* 左斜线 */}
      <line x1={leftBase} y1={base} x2={ridgeX} y2={top} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* 右斜线 */}
      <line x1={ridgeX} y1={top} x2={rightBase} y2={base} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* 底边 */}
      <line x1={leftBase} y1={base} x2={rightBase} y2={base} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* 右侧水平瓦片 */}
      {tiles}
    </g>
  );
}

function Logo({ lang }: { lang: string }) {
  if (lang === 'zh') {
    return (
      <svg viewBox="0 0 130 44" className="h-9 w-auto" xmlns="http://www.w3.org/2000/svg">
        {/* 屋顶盖在 "家和" 上方 */}
        <RoofIcon x={58} y={2} w={52} h={18} />
        {/* 跨境家和 */}
        <text x="2" y="34" fill="hsl(var(--primary))" fontFamily="sans-serif" fontSize="20" fontWeight="bold" letterSpacing="1">
          跨境家和
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 230 44" className="h-9 w-auto" xmlns="http://www.w3.org/2000/svg">
      {/* 屋顶盖在 "Jiahe" 上方 */}
      <RoofIcon x={118} y={2} w={64} h={18} />
      {/* Crossborder Jiahe */}
      <text x="2" y="34" fill="hsl(var(--primary))" fontFamily="Georgia, serif" fontSize="20" fontWeight="bold" letterSpacing="0.5">
        Crossborder Jiahe
      </text>
    </svg>
  );
}

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = i18n.language;

  return (
    <header className="sticky top-0 z-50 bg-white text-primary shadow-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* 左侧：Logo + 导航（桌面端显示） */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo lang={currentLang} />
          </Link>

          {/* 页面导航 */}
          <nav className="flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.labelKey}
                to={link.path}
                className={`text-base font-bold transition-colors hover:text-accent ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path)) ? 'text-accent' : ''
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        {/* 仅 Logo（移动端显示） */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo lang={currentLang} />
          </Link>
        </div>

        {/* 右侧：魔镜次数 + 语言切换 + 注册 + 登录（桌面端显示） */}
        <div className="hidden lg:flex items-center gap-3">
          {/* 魔镜报告次数 - 紫色药丸 */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-400 bg-purple-50 text-purple-700 text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            {user ? (profile?.free_reports_remaining ?? 0) : 1} {t('common.free')}
          </div>

          {/* 语言切换按钮 */}
          <button
            onClick={() => {
              const next = currentLang === 'zh' ? 'en' : 'zh';
              i18n.changeLanguage(next);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#C59A3F] text-[#C59A3F] text-sm font-bold hover:bg-[#C59A3F]/10 transition-colors"
          >
            <Globe className="w-4 h-4" />
            {currentLang === 'zh' ? 'EN' : '中文'}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/member" className="flex items-center gap-1 text-sm font-bold hover:text-accent">
                <User className="w-4 h-4" />
                {profile?.full_name || t('nav.memberCenter')}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-primary hover:bg-primary/10"
              >
                <LogOut className="w-4 h-4 mr-1" />
                {t('common.logout')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/register">
                <Button variant="ghost" className="text-sm font-bold text-primary hover:bg-primary/10">
                  {t('common.register')}
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="ghost" className="text-sm font-bold border border-primary/60 text-primary hover:bg-primary/10">
                  <LogIn className="w-4 h-4 mr-1" />
                  {t('common.login')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 移动端菜单 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-primary hover:bg-primary/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-white text-primary border-border">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.labelKey}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium py-2 hover:text-accent"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <Link to="/#contact" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full border border-primary/60 text-primary hover:bg-primary/10">
                  {t('header.consultation')}
                </Button>
              </Link>
              {user ? (
                <>
                  <Link to="/member" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2">
                    <User className="w-4 h-4" />
                    {profile?.full_name || t('nav.memberCenter')}
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => { signOut(); setOpen(false); }}
                    className="w-full text-primary hover:bg-primary/10"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    {t('common.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth/register" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full text-primary hover:bg-primary/10">
                      {t('common.register')}
                    </Button>
                  </Link>
                  <Link to="/auth/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full border border-primary/60 text-primary hover:bg-primary/10">
                      <LogIn className="w-4 h-4 mr-1" />
                      {t('common.login')}
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}