import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  textColor?: string;
}

export const ApplyEaseLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showWordmark = true,
  textColor = 'text-navy-950'
}) => {
  const sizeMap = {
    sm: { img: 'w-6 h-6', text: 'text-base' },
    md: { img: 'w-8 h-8', text: 'text-xl' },
    lg: { img: 'w-10 h-10', text: 'text-2xl' },
    xl: { img: 'w-14 h-14', text: 'text-3xl' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon using user-uploaded ApplyEase logo */}
      <img
        src="/assets/aistudio/image_133404a9.png"
        alt="ApplyEase Brand Identity"
        className={`${currentSize.img} object-contain rounded-sm shrink-0`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback inline SVG if image fails to load
          const target = e.currentTarget;
          target.style.display = 'none';
        }}
      />

      {showWordmark && (
        <span className={`font-bold tracking-tight font-sans whitespace-nowrap ${currentSize.text} ${textColor}`}>
          Apply<span className="text-[#f4772e]">Ease</span>
        </span>
      )}
    </div>
  );
};
