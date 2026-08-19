import React, { useRef, memo, useEffect } from 'react';
import { gsap } from 'gsap';
import { Badge } from '../../../../components/ui';

const CategoryCard = memo(({ icon, title, onClick, hasSaleBadge = false, isInstant = false, index = 0 }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          delay: index * 0.05,
          ease: 'power2.out',
        }
      );
    }
  }, [index]);

  return (
    <button
      type="button"
      ref={cardRef}
      className="flex flex-col items-center justify-center cursor-pointer relative group transition-all duration-300 ease-out active:scale-95 w-full h-full bg-white rounded-2xl p-2 sm:p-3 border border-slate-100/90 shadow-[0_3px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-blue-200 min-h-[92px] sm:min-h-[115px]"
      onClick={onClick}
    >
      {isInstant && (
        <span className="absolute top-1.5 right-1.5 z-10 flex items-center bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[7.5px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
          ⚡ INSTANT
        </span>
      )}
      {hasSaleBadge && !isInstant && (
        <span className="absolute top-1.5 right-1.5 z-10">
          <Badge variant="error" size="sm">
            SALE
          </Badge>
        </span>
      )}
      <div className="flex items-center justify-center mb-2 relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        {icon || (
          <span className="text-blue-600 text-xl font-bold" aria-hidden>
            {title?.[0] || '?'}
          </span>
        )}
      </div>
      <span className="text-[11px] sm:text-xs text-center text-slate-800 font-extrabold leading-snug w-full line-clamp-2 px-0.5 group-hover:text-blue-600 transition-colors">
        {title}
      </span>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

export default CategoryCard;
