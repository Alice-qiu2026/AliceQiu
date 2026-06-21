import { HelmetProvider, Helmet } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";

interface PageMetaProps {
  title?: string;
  description?: string;
  lang?: string;
  structuredData?: Record<string, unknown>;
}

const DEFAULT_TITLE = "跨境家和 | 守护跨境家庭，从理解开始";
const DEFAULT_DESCRIPTION = "专业跨境家庭法律服务 + 魔镜 AI 风险筛查，帮助移民家庭预防法律文化风险，守护家庭幸福。连接跨境华人与加拿大持牌专业律师。";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "跨境家和 CrossBorder JiaHe",
  "url": "https://crossborderjiahe.com",
  "logo": "https://crossborderjiahe.com/logo.png",
  "description": "连接跨境华人家庭与加拿大持牌专业律师的引荐平台",
  "founder": {
    "@type": "Person",
    "name": "Attorney Alice Qiu",
    "jobTitle": "Founder",
  },
  "sameAs": [],
  "areaServed": ["Canada", "China", "USA", "Hong Kong", "Singapore", "Bermuda"],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "跨境家和法律服务",
  "provider": {
    "@type": "Organization",
    "name": "跨境家和 CrossBorder JiaHe",
  },
  "description": "跨境家庭法律文化教育与风险识别服务，包括魔镜AI风险筛查、律师引荐与智能匹配",
  "serviceType": "Legal Referral & Family Education",
};

const PageMeta = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  lang = "zh",
  structuredData,
}: PageMetaProps) => {
  const jsonLd = structuredData || [organizationJsonLd, serviceJsonLd];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="跨境家庭,加拿大律师,移民法律,家庭法律,AI风险筛查,律师引荐,文化差异,跨国家庭" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={lang === "zh" ? "zh_CN" : "en_US"} />
      <link rel="canonical" href="https://crossborderjiahe.com" />
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <TooltipProvider>
      {children}
    </TooltipProvider>
  </HelmetProvider>
);

export default PageMeta;
