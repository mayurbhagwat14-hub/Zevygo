import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';
import { publicCatalogService } from '../../../../services/catalogService';
import { useCity } from '../../../../context/CityContext';
import ListingCard from '../../components/common/ListingCard';

const CategoryListings = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const category = location.state?.category;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await publicCatalogService.getProviderListings({
          categoryId,
          page,
          limit: 20
        });
        const items = res.listings || [];
        setListings(page === 1 ? items : (prev) => [...prev, ...items]);
        const total = res.pagination?.total || items.length;
        setHasMore(page * 20 < total);
      } catch (err) {
        console.error(err);
        if (page === 1) setListings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryId, currentCity?.name, page]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, currentCity?.name]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/user')}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-black text-neutral-900 truncate">
            {category?.title || 'Providers'}
          </h1>
          <p className="text-[10px] text-neutral-400 font-medium">
            {listings.length} listing{listings.length !== 1 ? 's' : ''} nearby
          </p>
        </div>
      </header>

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        {loading && listings.length === 0 ? (
          <div className="flex justify-center py-16">
            <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-neutral-100">
            <p className="text-sm font-black text-neutral-900">No providers yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Approved listing blocks for this category will show up here.
            </p>
          </div>
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => navigate(`/user/listings/${listing.id}`, { state: { listing } })}
            />
          ))
        )}

        {hasMore && !loading && (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="w-full py-2.5 text-xs font-bold text-primary-600"
          >
            Load more
          </button>
        )}
      </main>
    </div>
  );
};

export default CategoryListings;
