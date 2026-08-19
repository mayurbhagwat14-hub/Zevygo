import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiEye, FiFilter,
  FiSearch, FiRefreshCw, FiUser, FiMapPin, FiDollarSign, FiCalendar,
  FiFileText, FiImage, FiCheck, FiX, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

const STATUS_BADGES = {
  PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
  CHANGES_REQUESTED: { label: 'Changes Requested', bg: 'bg-orange-100 text-orange-800 border-orange-300' },
  PAUSED: { label: 'Paused', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-red-100 text-red-800 border-red-300' },
  DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-600 border-slate-300' },
};

const ServiceListingsReview = () => {
  const [listings, setListings] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  // Reject / Change request modal state
  const [rejectModal, setRejectModal] = useState({ open: false, listingId: null, isChangeRequest: false });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/service-listings', { params });
      if (res.data?.success) {
        setListings(res.data.data || []);
        setStatusCounts(res.data.statusCounts || {});
      }
    } catch (err) {
      console.error('Failed to load service listings:', err);
      toast.error('Failed to load service listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this service listing? It will go live immediately.')) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/service-listings/${id}/approve`);
      if (res.data?.success) {
        toast.success('Service listing approved!');
        setSelectedListing(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/service-listings/${rejectModal.listingId}/reject`, {
        reason: rejectReason.trim(),
        requestChanges: rejectModal.isChangeRequest
      });
      if (res.data?.success) {
        toast.success(rejectModal.isChangeRequest ? 'Changes requested from vendor' : 'Service listing rejected');
        setRejectModal({ open: false, listingId: null, isChangeRequest: false });
        setRejectReason('');
        setSelectedListing(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    const reason = window.prompt('Enter suspension reason:');
    if (reason === null) return;
    try {
      setActionLoading(true);
      const res = await api.patch(`/admin/service-listings/${id}/suspend`, { reason });
      if (res.data?.success) {
        toast.success('Service listing suspended');
        setSelectedListing(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Listings Review</h1>
          <p className="text-xs text-slate-500 mt-0.5">Approve, reject, or manage provider service listings across all categories</p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          ['PENDING_REVIEW', 'Pending Review', statusCounts.PENDING_REVIEW || 0],
          ['APPROVED', 'Approved', statusCounts.APPROVED || 0],
          ['CHANGES_REQUESTED', 'Changes Requested', statusCounts.CHANGES_REQUESTED || 0],
          ['REJECTED', 'Rejected', statusCounts.REJECTED || 0],
          ['PAUSED', 'Paused', statusCounts.PAUSED || 0],
          ['SUSPENDED', 'Suspended', statusCounts.SUSPENDED || 0],
          ['ALL', 'All Listings', Object.values(statusCounts).reduce((a, b) => a + b, 0)],
        ].map(([key, label, count]) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              statusFilter === key ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}>
            <span>{label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === key ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-md shadow-sm">
        <FiSearch className="w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()}
          placeholder="Search by title, category, vendor name..." className="w-full text-xs font-medium outline-none bg-transparent" />
      </div>

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-medium">Loading service listings...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <FiFileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-black text-slate-800">No Service Listings Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no listings matching status "{statusFilter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(item => {
            const badge = STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT;
            const vendor = item.vendorId || {};
            const price = item.pricing?.basePrice || item.pricing?.hourlyRate || item.pricing?.dailyRate || item.pricing?.monthlyRent || 0;

            return (
              <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider truncate">
                      {item.categoryName || 'Service'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 mb-1 line-clamp-1">{item.title}</h3>

                  {/* Vendor Info */}
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                    {vendor.profilePhoto ? (
                      <img src={vendor.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs shrink-0"><FiUser /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{vendor.name || 'Vendor'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{vendor.email} • {vendor.phone}</p>
                    </div>
                  </div>

                  {/* Pricing & Area */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 mb-3">
                    <span className="flex items-center gap-1"><FiDollarSign className="w-3.5 h-3.5 text-slate-400" /> ₹{price} / {(item.pricingModel || 'FIXED').toLowerCase()}</span>
                    <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5 text-slate-400" /> {item.serviceArea?.city || 'Any City'}</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button onClick={() => setSelectedListing(item)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors">
                    <FiEye className="w-3.5 h-3.5" /> View Detail
                  </button>

                  {item.status === 'PENDING_REVIEW' && (
                    <>
                      <button onClick={() => handleApprove(item._id)} disabled={actionLoading}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all">
                        <FiCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setRejectModal({ open: true, listingId: item._id, isChangeRequest: true })} disabled={actionLoading}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all">
                        <FiAlertCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{selectedListing.categoryName}</span>
                  <h2 className="text-lg font-black text-slate-900 mt-1">{selectedListing.title}</h2>
                </div>
                <button onClick={() => setSelectedListing(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Vendor Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                {selectedListing.vendorId?.profilePhoto ? (
                  <img src={selectedListing.vendorId.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><FiUser /></div>
                )}
                <div>
                  <h4 className="text-xs font-black text-slate-900">{selectedListing.vendorId?.name}</h4>
                  <p className="text-[10px] text-slate-500">{selectedListing.vendorId?.email} • {selectedListing.vendorId?.phone}</p>
                </div>
              </div>

              {/* Dynamic Answers */}
              {selectedListing.dynamicFormAnswers && Object.keys(selectedListing.dynamicFormAnswers).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Service Specific Answers</h4>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    {Object.entries(selectedListing.dynamicFormAnswers).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-bold text-slate-800">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pricing ({selectedListing.pricingModel})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedListing.pricing || {}).map(([k, v]) => v ? (
                    <div key={k} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xs font-black text-slate-900">₹{v}</span>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Portfolio Photos */}
              {selectedListing.portfolioPhotos?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Portfolio Photos</h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedListing.portfolioPhotos.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedListing.documents?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Certificates & Documents</h4>
                  <div className="space-y-1">
                    {selectedListing.documents.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs font-bold text-blue-700 hover:underline">
                        <FiFileText /> {doc.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                {selectedListing.status === 'PENDING_REVIEW' && (
                  <>
                    <button onClick={() => setRejectModal({ open: true, listingId: selectedListing._id, isChangeRequest: true })}
                      className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600">
                      Request Changes
                    </button>
                    <button onClick={() => setRejectModal({ open: true, listingId: selectedListing._id, isChangeRequest: false })}
                      className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700">
                      Reject
                    </button>
                    <button onClick={() => handleApprove(selectedListing._id)}
                      className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md">
                      Approve Service
                    </button>
                  </>
                )}
                {selectedListing.status === 'APPROVED' && (
                  <button onClick={() => handleSuspend(selectedListing._id)}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700">
                    Suspend Service
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECT / CHANGE REQUEST MODAL */}
      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-black text-slate-900">
                {rejectModal.isChangeRequest ? 'Request Changes from Vendor' : 'Reject Service Listing'}
              </h3>
              <p className="text-xs text-slate-500">
                {rejectModal.isChangeRequest
                  ? 'Specify what needs to be changed before this service can be approved. The vendor will be notified.'
                  : 'Provide the reason for rejecting this service listing. The vendor will receive this explanation.'}
              </p>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason here..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => { setRejectModal({ open: false, listingId: null, isChangeRequest: false }); setRejectReason(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={handleRejectSubmit} disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-md">
                  {actionLoading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServiceListingsReview;
