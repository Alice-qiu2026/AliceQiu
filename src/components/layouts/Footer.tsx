import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 左侧品牌 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">{lang === 'zh' ? '跨境家和' : 'CrossBorder JiaHe'}</h3>
              <p className="text-xs opacity-60 mt-0.5">
                {lang === 'zh' ? '律师引荐平台 · 非直接法律服务机构' : 'Lawyer Referral Platform · Not a Direct Legal Services Provider'}
              </p>
            </div>
            <p className="text-sm italic opacity-90">
              {t('footer.brandSlogan')}
            </p>
            <p className="text-sm opacity-75">
              {t('footer.brandDesc')}
            </p>
          </div>

          {/* 中间导航 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-accent">{t('footer.serviceNav')}</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link to="/magic-mirror" className="hover:text-accent transition-colors">🔮 {t('nav.magicMirror')}</Link>
              <Link to="/join" className="hover:text-accent transition-colors">💎 {t('nav.membership')}</Link>
              <Link to="/growth-camp" className="hover:text-accent transition-colors">🌱 {t('nav.growthCamp')}</Link>
              <Link to="/ai-mediation" className="hover:text-accent transition-colors">🤝 {t('nav.aiMediation')}</Link>
              <Link to="/certification" className="hover:text-accent transition-colors">✅ {t('nav.certification')}</Link>
              <Link to="/about" className="hover:text-accent transition-colors">👩‍💼 {t('nav.about')}</Link>
            </nav>
          </div>

          {/* 右侧联系 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-accent">{t('footer.contactTitle')}</h4>
            <div className="text-sm space-y-2">
              <p>👩‍💼 {t('footer.founder')}: Attorney Alice Qiu</p>
              <p>🌍 {t('footer.serviceArea')}: {t('home.contact.areaCanada')} · {t('home.contact.areaChina')} · {t('home.contact.areaNorthAmerica')}</p>
              <p>💬 {t('footer.languages')}: {t('header.chinese')} · {t('header.english')}</p>
              <p>📧 info@crossborderjiahe.com</p>
              <p>💬 {lang === 'zh' ? '微信' : 'WeChat'}: JiaHe2025</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm opacity-60">
          <span>© 2026 CrossBorder JiaHe. {t('footer.copyright')}.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-accent transition-colors hover:opacity-100">{t('footer.privacyPolicy')}</Link>
            <span className="opacity-40">|</span>
            <span>{t('footer.dataProcessing')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}