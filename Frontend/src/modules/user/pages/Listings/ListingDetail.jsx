import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiMapPin, FiStar, FiCheck, FiClock, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { publicCatalogService } from '../../../../services/catalogService';

const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <h2 className="text-sm font-black text-neutral-900">{title}</h2>
    {children}
  </div>
);

const ListingDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [listing, setListing] = useState(location.state?.listing || null);
  const [loading, setLoading] = useState(!location.state?.listing);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await publicCatalogService.getProviderListingById(id);
        if (res.success && res.listing) {
          setListing(res.listing);
        }
      } catch {
        toast.error('Could not load this listing');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading && !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6">
        <p className="text-sm font-bold text-neutral-700">Listing not found</p>
      </div>
    );
  }

  const photos = listing.portfolioPhotos || [];
  const price = listing.displayPrice || listing.pricing?.basePrice || listing.pricing?.hourlyRate || listing.pricing?.dailyRate || 0;
  const highlights = (listing.highlights || []).filter((h) => h.type !== 'file');
  const fileHighlights = (listing.highlights || []).filter((h) => h.type === 'file' && h.url);
  const pricingRows = listing.pricingRows || [];
  const workingDays = listing.availability?.workingDays || {};
  const openDays = Object.entries(workingDays).filter(([, d]) => d?.isOpen);
  const area = listing.serviceArea || {};
  const cancel = listing.cancellation || {};
  const config = listing.bookingConfig || {};
  const menu = listing.catalogItems || [];

  const handleBook = (item) => {
    navigate('/user/checkout', { state: { listing, catalogItem: item || null } });
  };

  return (
    <div className={`min-h-screen bg-white ${menu.length ? 'pb-8' : 'pb-24'}`}>
      <div className="relative h-56 bg-neutral-100">
        {photos[activePhoto] ? (
          <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">No photos</div>
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-neutral-800 shadow"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 px-4 -mt-6 relative z-10 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActivePhoto(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${i === activePhoto ? 'border-primary-500' : 'border-white'}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-4 space-y-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-primary-600">
            {listing.category?.title}
          </p>
          <h1 className="text-xl font-black text-neutral-900 mt-1">{listing.provider?.name || listing.title}</h1>
          <p className="text-sm font-bold text-neutral-700 mt-0.5">{listing.title}</p>
          {listing.shortDescription && (
            <p className="text-sm text-neutral-500 mt-1">{listing.shortDescription}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-600 font-medium">
            <span className="inline-flex items-center gap-1">
              <FiStar className="w-3.5 h-3.5 text-primary-500" />
              {listing.provider?.rating || '—'} ({listing.provider?.reviews || 0})
            </span>
            {area.city && (
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="w-3.5 h-3.5" /> {area.city}
              </span>
            )}
            {listing.experience > 0 && (
              <span>{listing.experience} yrs experience</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
          {listing.provider?.photo ? (
            <img src={listing.provider.photo} alt="" className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-black">
              {(listing.provider?.name || 'P').charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-black text-neutral-900">{listing.provider?.name}</p>
            <p className="text-[11px] text-neutral-500">{listing.provider?.completedJobs || 0} jobs completed</p>
          </div>
        </div>

        {listing.description && (
          <p className="text-sm text-neutral-600 leading-relaxed">{listing.description}</p>
        )}

        {menu.length > 0 && (
          <Section title="Menu">
            <div className="space-y-2">
              {menu.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-2xl border border-neutral-100 bg-white">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-black shrink-0">
                      {(item.title || 'I').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-neutral-900">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    {item.highlights?.length > 0 && (
                      <p className="text-[10px] text-neutral-400 mt-1 truncate">
                        {item.highlights.map((h) => `${h.label}: ${h.value}`).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-black text-neutral-900">₹{item.price || 0}</p>
                      <button
                        type="button"
                        onClick={() => handleBook(item)}
                        className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-[11px] font-black"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {menu.length === 0 && (
          <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-neutral-400">From</p>
              <p className="text-2xl font-black text-neutral-900">
                ₹{price}
                <span className="text-xs font-bold text-neutral-400 ml-1">
                  / {(listing.pricingModel || 'FIXED').toLowerCase().replace('_', ' ')}
                </span>
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Booking: {(listing.bookingMode || 'BOTH').replace('_', ' ')}
              </p>
            </div>
            {pricingRows.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                {pricingRows.map((row) => (
                  <div key={row.key} className="flex justify-between text-xs font-bold text-neutral-700">
                    <span className="capitalize text-neutral-500">{row.label}</span>
                    <span>₹{row.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {highlights.length > 0 && (
          <Section title="Service details">
            <div className="grid grid-cols-2 gap-2">
              {highlights.map((h) => (
                <div key={h.key} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <p className="text-[9px] font-bold uppercase text-neutral-400">{h.label}</p>
                  <p className="text-xs font-bold text-neutral-800 mt-0.5 break-words">{h.value}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {openDays.length > 0 && (
          <Section title="Availability">
            <div className="rounded-xl border border-neutral-100 p-3 space-y-2">
              {listing.availability?.isAvailableNow && (
                <p className="text-[11px] font-bold text-primary-700">Available now</p>
              )}
              {openDays.map(([day, data]) => (
                <div key={day} className="flex justify-between text-xs font-medium text-neutral-700">
                  <span>{DAY_LABELS[day] || day}</span>
                  <span className="inline-flex items-center gap-1 text-neutral-500">
                    <FiClock className="w-3 h-3" />
                    {(data.shifts || []).map((s) => `${s.start}–${s.end}`).join(', ') || 'Open'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(area.city || area.areas?.length || area.pincodes?.length) && (
          <Section title="Service area">
            <div className="rounded-xl border border-neutral-100 p-3 text-xs font-medium text-neutral-700 space-y-1">
              {area.city && <p>{area.city}{area.radiusKm ? ` · ${area.radiusKm} km radius` : ''}</p>}
              {area.areas?.length > 0 && <p>{area.areas.join(', ')}</p>}
              {area.pincodes?.length > 0 && <p>Pincodes: {area.pincodes.join(', ')}</p>}
            </div>
          </Section>
        )}

        {listing.languages?.length > 0 && (
          <p className="text-xs text-neutral-500">Languages: {listing.languages.join(', ')}</p>
        )}

        {(cancel.cancellationAllowed !== undefined || cancel.reschedulingAllowed !== undefined) && (
          <Section title="Cancellation">
            <div className="rounded-xl border border-neutral-100 p-3 text-xs font-medium text-neutral-700 space-y-1">
              <p>
                {cancel.cancellationAllowed
                  ? `Free cancel up to ${cancel.cancellationWindowHours || 0} hrs before${cancel.cancellationFeePercent ? ` · ${cancel.cancellationFeePercent}% fee after` : ''}`
                  : 'Cancellation not allowed'}
              </p>
              <p>
                {cancel.reschedulingAllowed
                  ? `Reschedule up to ${cancel.reschedulingWindowHours || 0} hrs before`
                  : 'Rescheduling not allowed'}
              </p>
            </div>
          </Section>
        )}

        {config.minAdvanceBookingMinutes ? (
          <p className="text-[11px] text-neutral-500">
            Book at least {config.minAdvanceBookingMinutes} min ahead
            {config.maxAdvanceBookingDays ? ` · up to ${config.maxAdvanceBookingDays} days` : ''}
          </p>
        ) : null}

        {(listing.documents?.length > 0 || fileHighlights.length > 0) && (
          <Section title="Certificates">
            <div className="space-y-2">
              {(listing.documents || []).map((doc, i) => (
                <a
                  key={`${doc.url}-${i}`}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border border-neutral-100 text-xs font-bold text-primary-700"
                >
                  <FiFileText className="w-4 h-4" /> {doc.label || 'Document'}
                </a>
              ))}
              {fileHighlights.map((h) => (
                <a
                  key={h.key}
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border border-neutral-100 text-xs font-bold text-primary-700"
                >
                  <FiFileText className="w-4 h-4" /> {h.label}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>

      {menu.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4">
          <button
            type="button"
            onClick={() => handleBook(null)}
            className="w-full py-3.5 rounded-2xl bg-primary-600 text-white text-sm font-black hover:bg-primary-700 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <FiCheck className="w-4 h-4" /> Book Now
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
