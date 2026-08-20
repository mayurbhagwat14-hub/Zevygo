import React from 'react';
import { FiMapPin, FiStar } from 'react-icons/fi';

const ListingCard = ({ listing, onClick }) => {
  const cover = listing.portfolioPhotos?.[0] || listing.provider?.photo;
  const price = listing.displayPrice || listing.pricing?.basePrice || listing.pricing?.hourlyRate || listing.pricing?.dailyRate || 0;
  const provider = listing.provider || {};
  const itemCount = listing.itemCount || listing.catalogItems?.length || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm active:scale-[0.99] transition-all"
    >
      <div className="flex gap-3 p-3">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400 bg-primary-50 text-primary-700">
              {(provider.name || listing.title || 'P').charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary-600 truncate">
            {listing.category?.title || 'Service'}
          </p>
          <h3 className="text-sm font-black text-neutral-900 mt-0.5 line-clamp-1 leading-snug">
            {provider.name || listing.title}
          </h3>
          <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
            {listing.title}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-black text-neutral-900">
              {price ? <>From ₹{price}</> : 'View menu'}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-neutral-600">
              <FiStar className="w-3 h-3 text-primary-500" />
              {provider.rating || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-neutral-400 font-medium">
              {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'} on menu` : 'Open shop'}
            </p>
            {listing.serviceArea?.city && (
              <p className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                <FiMapPin className="w-3 h-3" /> {listing.serviceArea.city}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ListingCard;
