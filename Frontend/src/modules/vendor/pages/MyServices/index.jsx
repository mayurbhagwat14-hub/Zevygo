import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiEdit2, FiPauseCircle, FiPlayCircle, FiTrash2,
  FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiLayers, FiDollarSign,
  FiMapPin, FiStar, FiFileText, FiLoader
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { colors } from '../../../../theme';

const STATUS_CONFIG = {
  APPROVED: { label: 'Live', icon: FiCheckCircle, bg: colors.success[50], fg: colors.success[700], border: colors.success[100] },
  PENDING_REVIEW: { label: 'Under Review', icon: FiClock, bg: colors.warning[50], fg: colors.warning[700], border: colors.warning[100] },
  DRAFT: { label: 'Draft', icon: FiFileText, bg: colors.neutral[100], fg: colors.neutral[600], border: colors.neutral[200] },
  PAUSED: { label: 'Paused', icon: FiPauseCircle, bg: colors.neutral[100], fg: colors.neutral[700], border: colors.neutral[200] },
  REJECTED: { label: 'Rejected', icon: FiXCircle, bg: colors.error[50], fg: colors.error[700], border: colors.error[100] },
  CHANGES_REQUESTED: { label: 'Changes Needed', icon: FiAlertCircle, bg: colors.warning[50], fg: colors.warning[700], border: colors.warning[100] },
  SUSPENDED: { label: 'Suspended', icon: FiXCircle, bg: colors.error[50], fg: colors.error[700], border: colors.error[100] },
};

const MyServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors/services');
      if (res.data?.data) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching listing blocks:', err);
      toast.error('Failed to load listing blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (serviceId) => {
    try {
      const res = await api.patch(`/vendors/services/${serviceId}/toggle`);
      if (res.data?.success) {
        toast.success(res.data.message);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Delete this listing block? Customers will no longer see it.')) return;
    try {
      const res = await api.delete(`/vendors/services/${serviceId}`);
      if (res.data?.success) {
        toast.success('Listing block deleted');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const filteredServices = activeFilter === 'ALL' ? services : services.filter((s) => s.status === activeFilter);

  const statusCounts = services.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const getPrice = (item) => {
    const activeItems = (item.catalogItems || []).filter((i) => i.isActive !== false && i.title);
    if (activeItems.length) {
      const prices = activeItems.map((i) => Number(i.price) || 0).filter((p) => p > 0);
      if (prices.length) return Math.min(...prices);
    }
    const p = item.pricing || {};
    return p.basePrice || p.hourlyRate || p.dailyRate || p.monthlyRent || p.perGuardRate || p.packagePrice || 0;
  };

  const getMenuCount = (item) => (item.catalogItems || []).filter((i) => i.isActive !== false && i.title).length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700 active:scale-95"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-black text-neutral-900 tracking-tight">Listing Blocks</h1>
              <p className="text-[10px] text-neutral-400 font-medium">
                {services.length} listing{services.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/vendor/add-service')}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <FiPlus className="w-4 h-4" /><span>Create</span>
          </button>
        </div>

        {services.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-hide">
            {[['ALL', 'All', services.length], ...Object.entries(STATUS_CONFIG).filter(([k]) => statusCounts[k]).map(([k, v]) => [k, v.label, statusCounts[k]])].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all shrink-0 ${
                  activeFilter === key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-neutral-600 border-neutral-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <FiLayers />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                {activeFilter === 'ALL' ? 'No Listing Blocks Yet' : `No ${STATUS_CONFIG[activeFilter]?.label || ''} Listings`}
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Create a listing block for each approved service so customers can find and book you.
              </p>
            </div>
            <button
              onClick={() => navigate('/vendor/add-service')}
              className="bg-primary-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md hover:bg-primary-700 active:scale-95 transition-all"
            >
              <FiPlus /><span>Create Listing Block</span>
            </button>
          </div>
        ) : (
          filteredServices.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusInfo.icon;
            const reason = item.rejectedReason || item.adminNotes;

            return (
              <div key={item._id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div
                  className="px-4 py-1.5 flex items-center justify-between border-b"
                  style={{ backgroundColor: statusInfo.bg, color: statusInfo.fg, borderColor: statusInfo.border }}
                >
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold">
                    <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                  </span>
                  {item.hasPendingEdits && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: colors.warning[100], color: colors.warning[700] }}
                    >
                      Live version still public
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase border border-primary-100">
                        {item.categoryName || 'Service'}
                      </span>
                      <h3 className="text-sm font-black text-neutral-900 mt-1.5 truncate">{item.title}</h3>
                    </div>
                    {item.categoryId?.homeIconUrl && (
                      <img src={item.categoryId.homeIconUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-neutral-50 p-1 border border-neutral-100 shrink-0" />
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{item.description}</p>
                  )}

                  {(item.status === 'REJECTED' || item.status === 'CHANGES_REQUESTED') && reason && (
                    <div
                      className="rounded-lg p-2.5 mb-3 border"
                      style={{ backgroundColor: colors.error[50], borderColor: colors.error[100] }}
                    >
                      <p className="text-[10px] font-bold mb-0.5" style={{ color: colors.error[800] || colors.error[700] }}>
                        {item.status === 'CHANGES_REQUESTED' ? 'Changes required' : 'Rejected'}
                      </p>
                      <p className="text-[10px]" style={{ color: colors.error[700] }}>{reason}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 mb-3 flex-wrap">
                    <span className="flex items-center gap-1 font-black text-neutral-800">
                      <FiDollarSign className="w-3 h-3" />
                      {getMenuCount(item) > 0 ? `From ₹${getPrice(item)}` : `₹${getPrice(item)}`}
                    </span>
                    {getMenuCount(item) > 0 && (
                      <span className="flex items-center gap-1">
                        <FiLayers className="w-3 h-3" />
                        {getMenuCount(item)} menu item{getMenuCount(item) === 1 ? '' : 's'}
                      </span>
                    )}
                    {item.serviceArea?.city && (
                      <span className="flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" /> {item.serviceArea.city}
                      </span>
                    )}
                    {item.experience > 0 && (
                      <span className="flex items-center gap-1">
                        <FiStar className="w-3 h-3" /> {item.experience} yrs
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => navigate(`/vendor/edit-service/${item._id}`)}
                      className="text-xs font-bold text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 flex items-center gap-1 transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      {item.status === 'CHANGES_REQUESTED' ? 'Edit & Resubmit' : 'Edit'}
                    </button>

                    <div className="flex items-center gap-2">
                      {(item.status === 'APPROVED' || item.status === 'PAUSED') && (
                        <button
                          onClick={() => handleToggle(item._id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        >
                          {item.status === 'APPROVED' ? <><FiPauseCircle /> Pause</> : <><FiPlayCircle /> Resume</>}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: colors.error[500] }}
                        title="Delete listing"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default MyServices;
