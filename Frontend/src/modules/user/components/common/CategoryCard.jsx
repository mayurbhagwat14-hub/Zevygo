import React, { useRef, memo, useEffect } from 'react';
import { gsap } from 'gsap';
import { Badge } from '../../../../components/ui';

const CategoryCard = memo(({ icon, title, onClick, hasSaleBadge = false, index = 0 }) => {
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
      className="flex flex-col items-center justify-start cursor-pointer relative group transition-transform duration-300 ease-out active:scale-95 w-full h-full bg-transparent border-0"
      onClick={onClick}
      style={{ opacity: 0 }}
    >
      <div className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] flex items-center justify-center mb-2 relative flex-shrink-0 transition-all duration-300 group-hover:scale-105">
        {icon || (
          <span className="text-primary-500 text-xl font-bold" aria-hidden>
            {title?.[0] || '?'}
          </span>
        )}
        {hasSaleBadge && (
          <span className="absolute -top-1 -right-1 z-10">
            <Badge variant="error" size="sm">
              SALE
            </Badge>
          </span>
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] text-center text-neutral-800 font-bold leading-tight tracking-tight w-full line-clamp-2 px-1 group-hover:text-primary-500 transition-colors">
        {title}
      </span>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

export default CategoryCard;
