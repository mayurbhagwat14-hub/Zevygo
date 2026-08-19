import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiEdit2, FiPauseCircle, FiPlayCircle, FiTrash2,
  FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiLayers, FiDollarSign,
  FiMapPin, FiStar, FiFileText, FiLoader
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

const STATUS_CONFIG = {
  APPROVED: { label: 'Live', icon: FiCheckCircle, color: 'emerald', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PENDING_REVIEW: { label: 'Under Review', icon: FiClock, color: 'amber', bgClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  DRAFT: { label: 'Draft', icon: FiFileText, color: 'slate', bgClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  PAUSED: { label: 'Paused', icon: FiPauseCircle, color: 'slate', bgClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  REJECTED: { label: 'Rejected', icon: FiXCircle, color: 'red', bgClass: 'bg-red-50 text-red-700 border-red-200' },
  CHANGES_REQUESTED: { label: 'Changes Needed', icon: FiAlertCircle, color: 'orange', bgClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  SUSPENDED: { label: 'Suspended', icon: FiXCircle, color: 'red', bgClass: 'bg-red-50 text-red-700 border-red-200' },
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
      console.error('Error fetching services:', err);
      toast.error('Failed to load services');
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
    if (!window.confirm('Are you sure you want to delete this service listing?')) return;
    try {
      const res = await api.delete(`/vendors/services/${serviceId}`);
      if (res.data?.success) {
        toast.success('Service deleted');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const filteredServices = activeFilter === 'ALL' ? services : services.filter(s => s.status === activeFilter);

  const statusCounts = services.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const getPrice = (item) => {
    const p = item.pricing || {};
    return p.basePrice || p.hourlyRate || p.dailyRate || p.monthlyRent || p.perGuardRate || p.packagePrice || 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/vendor/dashboard')}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 active:scale-95">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">My Services</h1>
              <p className="text-[10px] text-slate-400 font-medium">{services.length} service{services.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => navigate('/vendor/add-service')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
            <FiPlus className="w-4 h-4" /><span>Add Service</span>
          </button>
        </div>

        {/* Filter Tabs */}
        {services.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-hide">
            {[['ALL', 'All', services.length], ...Object.entries(STATUS_CONFIG).filter(([k]) => statusCounts[k]).map(([k, v]) => [k, v.label, statusCounts[k]])].map(([key, label, count]) => (
              <button key={key} onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all shrink-0 ${
                  activeFilter === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                }`}>
                {label} ({count})
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="p-4 max-w-xl mx-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <FiLayers />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {activeFilter === 'ALL' ? 'No Services Added Yet' : `No ${STATUS_CONFIG[activeFilter]?.label || ''} Services`}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Add the services you offer to start receiving customer bookings.
              </p>
            </div>
            <button onClick={() => navigate('/vendor/add-service')}
              className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md hover:bg-blue-700 active:scale-95 transition-all">
              <FiPlus /><span>Add Your First Service</span>
            </button>
          </div>
        ) : (
          filteredServices.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusInfo.icon;
            const price = getPrice(item);

            return (
              <div key={item._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                {/* Status Bar */}
                <div className={`px-4 py-1.5 flex items-center justify-between ${statusInfo.bgClass} border-b`}>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold">
                    <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                  </span>
                  {item.hasPendingEdits && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Edits Pending Review</span>
                  )}
                </div>

                <div className="p-4">
                  {/* Title & Category */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                        {item.categoryName || 'Service'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-1.5 truncate">{item.title}</h3>
                    </div>
                    {item.categoryId?.homeIconUrl && (
                      <img src={item.categoryId.homeIconUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100 shrink-0" />
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                  )}

                  {/* Rejection / Changes Requested Reason */}
                  {(item.status === 'REJECTED' || item.status === 'CHANGES_REQUESTED') && item.rejectedReason && (
                    <div className="bg-red-50 rounded-lg p-2.5 mb-3 border border-red-100">
                      <p className="text-[10px] font-bold text-red-800 mb-0.5">
                        {item.status === 'CHANGES_REQUESTED' ? '⚠️ Changes Required:' : '❌ Rejection Reason:'}
                      </p>
                      <p className="text-[10px] text-red-700">{item.rejectedReason}</p>
                    </div>
                  )}

                  {/* Info Row */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3" />
                      <span className="font-black text-slate-800">₹{price}</span>
                      <span className="font-medium">/{(item.pricingModel || 'FIXED').toLowerCase().replace('_', ' ')}</span>
                    </span>
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

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button onClick={() => navigate(`/vendor/edit-service/${item._id}`)}
                      className="text-xs font-bold text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1 transition-colors">
                      <FiEdit2 className="w-3.5 h-3.5" />
                      {item.status === 'CHANGES_REQUESTED' ? 'Edit & Resubmit' : 'Edit'}
                    </button>

                    <div className="flex items-center gap-2">
                      {(item.status === 'APPROVED' || item.status === 'PAUSED') && (
                        <button onClick={() => handleToggle(item._id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                            item.status === 'APPROVED' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}>
                          {item.status === 'APPROVED' ? <><FiPauseCircle /> Pause</> : <><FiPlayCircle /> Resume</>}
                        </button>
                      )}
                      <button onClick={() => handleDelete(item._id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Service">
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
