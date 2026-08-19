import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiMapPin, FiStar, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { publicCatalogService } from '../../../../services/catalogService';

const formatAnswer = (v) => {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string' && v.startsWith('data:')) return 'Uploaded';
  return String(v ?? '');
};

const ListingDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [listing, setListing] = useState(location.state?.listing || null);
  const [schema, setSchema] = useState([]);
  const [loading, setLoading] = useState(!location.state?.listing);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await publicCatalogService.getProviderListingById(id);
        if (res.success && res.listing) {
          setListing(res.listing);
          setSchema(res.vendorFormSchema || []);
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
  const answers = listing.dynamicFormAnswers || {};
  const labelFor = (key) => schema.find((f) => f.key === key)?.label || key.replace(/([A-Z_])/g, ' $1');

  const handleBook = () => {
    navigate('/user/checkout', { state: { listing } });
  };

  return (
    <div className="min-h-screen bg-white pb-24">
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

      <div className="px-4 pt-4 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-primary-600">
            {listing.category?.title}
          </p>
          <h1 className="text-xl font-black text-neutral-900 mt-1">{listing.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600 font-medium">
            <span className="inline-flex items-center gap-1">
              <FiStar className="w-3.5 h-3.5 text-primary-500" />
              {listing.provider?.rating || '—'} ({listing.provider?.reviews || 0})
            </span>
            {listing.serviceArea?.city && (
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="w-3.5 h-3.5" /> {listing.serviceArea.city}
              </span>
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

        <div className="rounded-2xl border border-neutral-100 p-4">
          <p className="text-[10px] font-bold uppercase text-neutral-400">From</p>
          <p className="text-2xl font-black text-neutral-900">
            ₹{price}
            <span className="text-xs font-bold text-neutral-400 ml-1">
              / {(listing.pricingModel || 'FIXED').toLowerCase().replace('_', ' ')}
            </span>
          </p>
        </div>

        {Object.keys(answers).length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-black text-neutral-900">Highlights</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(answers).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <p className="text-[9px] font-bold uppercase text-neutral-400">{labelFor(k)}</p>
                  <p className="text-xs font-bold text-neutral-800 mt-0.5 break-words">{formatAnswer(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {listing.languages?.length > 0 && (
          <p className="text-xs text-neutral-500">Languages: {listing.languages.join(', ')}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4">
        <button
          type="button"
          onClick={handleBook}
          className="w-full py-3.5 rounded-2xl bg-primary-600 text-white text-sm font-black hover:bg-primary-700 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <FiCheck className="w-4 h-4" /> Book Now
        </button>
      </div>
    </div>
  );
};

export default ListingDetail;
