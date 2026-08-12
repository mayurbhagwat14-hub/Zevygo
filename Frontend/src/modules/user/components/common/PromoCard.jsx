import React, { memo } from 'react';
import { themeColors } from '../../../../theme';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import OptimizedVideo from '../../../../components/common/OptimizedVideo';

const PromoCard = memo(({ title, subtitle, buttonText, image, onClick, className = '' }) => {
  const isVideo = image && (
    image.includes('video/upload') ||
    image.match(/\.(mp4|webm|ogg|mov)$|^https:\/\/res\.cloudinary\.com.*\/video\//i)
  );

  return (
    <div
      className={`relative rounded-[24px] overflow-hidden min-w-[320px] md:min-w-[400px] h-[190px] md:h-56 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-[#031B33] via-[#093560] to-[#125396] ${className}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#031B33] via-[#031B33]/80 to-transparent z-10" />
        {image ? (
          isVideo ? (
            <OptimizedVideo
              src={image}
              className="w-full h-full object-cover object-right"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <OptimizedImage
              src={image}
              alt={title || 'Promo'}
              className="w-full h-full object-cover object-right ml-auto max-w-[60%]"
            />
          )
        ) : null}
      </div>

      <div className="relative z-20 flex flex-col justify-center h-full p-6 w-[70%]">
        {title && (
          <h3 className="text-[22px] font-black text-white leading-tight mb-1">
            {title.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </h3>
        )}
        {subtitle && (
          <p className="text-[13px] text-white/80 font-medium mb-4 line-clamp-2">
            {subtitle}
          </p>
        )}
        {buttonText && (
          <button className="bg-[#2563EB] text-white text-[13px] font-bold py-2 px-5 rounded-full w-max flex items-center gap-2 shadow-lg shadow-blue-500/30">
            {buttonText} <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
});

PromoCard.displayName = 'PromoCard';

export default PromoCard;
