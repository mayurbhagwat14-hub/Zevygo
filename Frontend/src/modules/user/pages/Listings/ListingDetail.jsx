import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiMapPin, FiStar, FiCheck, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { publicCatalogService } from '../../../../services/catalogService';
import BookingModeBadge from '../../components/common/BookingModeBadge';



const Section = ({ title, subtitle, children }) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-[15px] font-black text-neutral-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const PackageBlock = ({ item, index, onBook }) => {
  const chips = (item.highlights || []).slice(0, 3);
  const [imageError, setImageError] = React.useState(false);

  return (
    <article className="rounded-[20px] border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-2.5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      {/* Top Image / Banner */}
      <div className="relative h-[130px] w-full rounded-[16px] overflow-hidden bg-gray-900 border border-gray-100/50">
        {item.photoUrl && !imageError ? (
          <img src={item.photoUrl} alt="" className="w-full h-full object-cover opacity-95" onError={() => setImageError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <span className="text-3xl font-black text-slate-700">
              {(item.title || 'P').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="px-2 pt-3 pb-1 space-y-4">
        {/* Title, Description, Price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[17px] font-black text-[#1c1c1c] leading-tight tracking-tight">{item.title || 'Package'}</h3>
            <span className="text-[16px] font-black text-gray-900 tracking-tight shrink-0">
              ₹{Number(item.price || 0).toLocaleString('en-IN')}
            </span>
          </div>
          {item.description && (
            <p className="text-[12.5px] text-[#5e5e5e] font-medium mt-1.5 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Feature Highlights Row */}
        {chips.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-0.5">
            {chips.map((h, i) => (
              <div key={`${h.label}-${h.value}`} className="flex items-center gap-2.5 shrink-0">
                <div className="w-[32px] h-[32px] rounded-[10px] bg-[#f5f6f8] flex items-center justify-center shrink-0">
                  <FiCheck className="w-4 h-4 text-[#5e5e5e]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-[#1c1c1c] leading-tight">{h.label}</span>
                  <span className="text-[10px] font-medium text-[#5e5e5e] mt-0.5">{h.value}</span>
                </div>
                {i < chips.length - 1 && (
                  <div className="w-px h-6 bg-gray-200 ml-3 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Button */}
        <button
          type="button"
          onClick={() => onBook(item)}
          className="w-full py-3 rounded-[12px] bg-[#0F348F] hover:bg-[#122652] text-white text-[13.5px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-[#0F348F]/20 mt-1"
        >
          Book this package
          <FiArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};

const ListingDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [listing, setListing] = useState(location.state?.listing || null);
  const [loading, setLoading] = useState(!location.state?.listing);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const hasCached = Boolean(listing);
      try {
        if (!hasCached) setLoading(true);
        const res = await publicCatalogService.getProviderListingById(id);
        if (!cancelled && res.success && res.listing) {
          setListing(res.listing);
        }
      } catch {
        if (!cancelled && !hasCached) toast.error('Could not load this listing');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6 bg-neutral-50 min-h-screen">
        <p className="text-sm font-bold text-neutral-700">Listing not found</p>
      </div>
    );
  }

  const photos = listing.portfolioPhotos || [];
  const price = listing.displayPrice || listing.pricing?.basePrice || listing.pricing?.hourlyRate || listing.pricing?.dailyRate || 0;
  const highlights = (listing.highlights || []).filter((h) => h.type !== 'file');
  const pricingRows = listing.pricingRows || [];
  const area = listing.serviceArea || {};
  const menu = listing.catalogItems || [];
  const fromPrice = menu.length
    ? Math.min(...menu.map((i) => Number(i.price) || 0).filter((n) => n > 0))
    : Number(price) || 0;

  const handleBook = (item) => {
    navigate('/user/checkout', { state: { listing, catalogItem: item || null } });
  };

  const openProvider = () => {
    const vid = listing.provider?.id;
    if (!vid) return;
    navigate(`/user/provider/${vid}`, { state: { categoryId: listing.category?.id } });
  };

  return (
    <div className={`min-h-screen bg-gray-50/50 ${menu.length ? 'pb-10' : 'pb-28'}`}>
      {/* Hero */}
      <div className="relative h-48 bg-gray-900">
        {photos[activePhoto] ? (
          <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover opacity-90 mix-blend-overlay" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-end p-5">
            <p className="text-sm font-black text-white/20">{listing.category?.title || 'Service'}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm active:scale-95 transition-all"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1.5">
            {listing.category?.title}
          </p>
          <h1 className="text-[26px] font-black leading-tight tracking-tight drop-shadow-sm">
            {listing.provider?.businessName || listing.provider?.name || listing.title}
          </h1>
          <p className="text-[15px] font-medium text-white/80 mt-1">{listing.title}</p>
        </div>
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2.5 px-5 -mt-6 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActivePhoto(i)}
              className={`w-16 h-16 rounded-[14px] overflow-hidden border-[3px] shrink-0 shadow-md transition-all ${
                i === activePhoto ? 'border-white scale-105' : 'border-white/50 opacity-80'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pt-6 space-y-7 max-w-lg mx-auto">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2">
          {listing.bookingMode && <BookingModeBadge mode={listing.bookingMode} />}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-100 text-[12px] font-bold text-yellow-700">
            <FiStar className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            {listing.provider?.rating || '—'} ({listing.provider?.reviews || 0})
          </span>
          {area.city && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-[12px] font-bold text-gray-700">
              <FiMapPin className="w-3.5 h-3.5 text-gray-500" /> {area.city}
            </span>
          )}
          {fromPrice > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[12px] font-bold text-emerald-700">
              From ₹{fromPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {listing.shortDescription && (
          <p className="text-sm text-neutral-600 leading-relaxed">{listing.shortDescription}</p>
        )}

        {/* Provider card */}
        <button
          type="button"
          onClick={openProvider}
          className="w-full flex items-center gap-4 p-4 rounded-[20px] bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] text-left active:scale-[0.98] transition-transform"
        >
          {listing.provider?.photo ? (
            <img src={listing.provider.photo} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-50 shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center font-black text-xl border-2 border-white shadow-sm">
              {(listing.provider?.name || 'P').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-black text-gray-900 truncate tracking-tight">{listing.provider?.businessName || listing.provider?.name}</p>
            <p className="text-[12px] text-[#0F348F] font-bold mt-0.5">
              View full profile · all packages
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
            <FiChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {listing.description && (
          <p className="text-sm text-neutral-600 leading-relaxed">{listing.description}</p>
        )}

        {/* Multi package blocks — hero section */}
        {menu.length > 0 && (
          <Section
            title="Packages & types"
            subtitle={`${menu.length} option${menu.length === 1 ? '' : 's'} · pick one to book`}
          >
            <div className="space-y-4">
              {menu.map((item, index) => (
                <PackageBlock
                  key={item.id || `${item.title}-${index}`}
                  item={item}
                  index={index}
                  onBook={handleBook}
                />
              ))}
            </div>
          </Section>
        )}

        {menu.length === 0 && (
          <div className="rounded-[24px] border border-gray-100 bg-white p-6 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Starting from</p>
              <p className="text-4xl font-black text-gray-900 mt-1 tracking-tight">
                ₹{Number(price).toLocaleString('en-IN')}
                <span className="text-sm font-bold text-gray-400 ml-2 tracking-normal">
                  / {(listing.pricingModel || 'FIXED').toLowerCase().replace('_', ' ')}
                </span>
              </p>
            </div>
            {pricingRows.length > 1 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {pricingRows.map((row) => (
                  <div key={row.key} className="flex justify-between text-[13px] font-bold text-gray-700">
                    <span className="capitalize text-gray-500">{row.label}</span>
                    <span>₹{row.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {highlights.length > 0 && (
          <Section title="Service details">
            <div className="grid grid-cols-2 gap-3">
              {highlights.map((h) => (
                <div key={h.key} className="p-4 rounded-[16px] bg-white border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{h.label}</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1.5 break-words leading-tight">{h.value}</p>
                </div>
              ))}
            </div>
          </Section>
        )}


      </div>

      {menu.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-neutral-200 p-4">
          <button
            type="button"
            onClick={() => handleBook(null)}
            className="w-full py-3.5 rounded-[14px] bg-[#163a99] hover:bg-[#122e7a] text-white text-[14px] font-bold active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-[#163a99]/20 transition-all"
          >
            <FiCheck className="w-4 h-4" /> Book Now
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
