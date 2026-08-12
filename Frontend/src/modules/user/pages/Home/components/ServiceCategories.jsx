import React from 'react';
import CategoryCard from '../../../components/common/CategoryCard';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const ServiceCategories = React.memo(({ categories, onCategoryClick }) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const serviceCategories = categories.map((cat) => ({
    ...cat,
    icon: toAssetUrl(cat.icon || cat.image),
  }));

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-sm mx-1">
      <div className="flex overflow-x-auto scrollbar-hide gap-3 items-start pb-2">
        {serviceCategories.map((category, index) => {
          const iconSrc = toAssetUrl(category.icon || category.image);
          return (
            <div key={category.id || category._id || index} className="flex-shrink-0 w-20 px-1">
              <CategoryCard
                title={category.title}
                icon={
                  iconSrc ? (
                    <img
                      src={iconSrc}
                      alt=""
                      className="w-8 h-8 object-contain transition-transform duration-500 will-change-transform"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null
                }
                onClick={() => onCategoryClick?.(category)}
                hasSaleBadge={category.hasSaleBadge}
                index={index}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

ServiceCategories.displayName = 'ServiceCategories';

export default ServiceCategories;
