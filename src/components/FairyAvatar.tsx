import { useTranslation } from 'react-i18next';

interface FairyAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'blue' | 'pink';
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-28 h-28',
  xl: 'w-36 h-36',
};

const borderMap = {
  blue: 'border-[#C59A3F]/30',
  pink: 'border-2 border-[#F4A4A4]',
};

const borderLgMap = {
  blue: 'border-4 border-white',
  pink: 'border-4 border-white',
};

export default function FairyAvatar({ size = 'sm', className = '', variant = 'pink' }: FairyAvatarProps) {
  const { t } = useTranslation();
  const isLg = size === 'lg' || size === 'xl';

  return (
    <div className={`relative inline-block ${sizeMap[size]} ${className}`}>
      {/* 主头像 */}
      <div className={`w-full h-full rounded-full overflow-hidden ${isLg ? borderLgMap[variant] : borderMap[variant]} ${isLg ? 'shadow-lg' : ''}`}>
        <img
          src="https://miaoda-conversation-file.cdn.bcebos.com/user-buketv2zz56o/app-cc2fqeuowe81/20260615/image_1781489006602.png"
          alt={t('aiMediation.blueFairy')}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 眨眼动画覆盖层：左眼 */}
      <div
        className="absolute rounded-full bg-[#3d2e1f]/25 pointer-events-none fairy-blink"
        style={{
          top: '39%',
          left: '43%',
          transform: 'translateX(-50%)',
          width: '10%',
          height: '4%',
        }}
      />
      {/* 眨眼动画覆盖层：右眼 */}
      <div
        className="absolute rounded-full bg-[#3d2e1f]/25 pointer-events-none fairy-blink"
        style={{
          top: '39%',
          left: '58%',
          transform: 'translateX(-50%)',
          width: '10%',
          height: '4%',
        }}
      />

      {/* 魔杖星星动画 */}
      <div className="absolute fairy-star" style={{ top: '28%', right: '5%' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#FFD700]">
          <polygon
            points="5,0 6,3.5 10,3.5 7,5.5 8,9 5,7 2,9 3,5.5 0,3.5 4,3.5"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="absolute fairy-star-delay" style={{ top: '22%', right: '15%' }}>
        <svg width="6" height="6" viewBox="0 0 10 10" className="text-[#FFD700]">
          <polygon
            points="5,0 6,3.5 10,3.5 7,5.5 8,9 5,7 2,9 3,5.5 0,3.5 4,3.5"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* 魔法光环脉冲 */}
      <div className="absolute inset-0 rounded-full fairy-glow pointer-events-none" />
    </div>
  );
}
