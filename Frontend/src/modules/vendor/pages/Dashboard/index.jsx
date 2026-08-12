import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBriefcase, FiStar, FiBell, FiArrowRight, FiUser, FiClock, FiMapPin, FiCheckCircle, FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import { vendorTheme as themeColors, gradients } from '../../../../theme';
import { Button } from '../../../../components/ui';
import Header from '../../components/layout/Header';
import { vendorDashboardService } from '../../services/dashboardService';
import { acceptBooking, rejectBooking, assignWorker } from '../../services/bookingService';
// Booking alert handled globally
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { registerFCMToken } from '../../../../services/pushNotificationService';
import LogoLoader from '../../../../components/common/LogoLoader';
import StatsCards from './components/StatsCards';
import PendingBookings from './components/PendingBookings';


const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

const Dashboard = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [stats, setStats] = useState({
    todayEarnings: 0,
    activeJobs: 0,
    pendingAlerts: 0,
    workersOnline: 0,
    totalEarnings: 0,
    completedJobs: 0,
    rating: 0,
  });
  const [vendorProfile, setVendorProfile] = useState({
    name: 'Vendor Name',
    businessName: 'Business Name',
    photo: null,
    service: []
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalConfig, setGlobalConfig] = useState({ maxSearchTime: 5, waveDuration: 60 });

  const ignoredBookingIds = useRef(new Set());

  // Process API response - extracted to avoid duplication
  const processApiResponse = useCallback((response) => {
    if (!response.success) return;

    const { stats: apiStats, recentBookings, config } = response.data;
    if (config) setGlobalConfig(config);

    // Separate requested/searching bookings from other bookings
    const requestedBookings = (recentBookings || []).filter(booking => {
      const status = booking.status?.toLowerCase();
      return status === 'requested' || status === 'searching';
    });
    const otherBookings = (recentBookings || []).filter(booking => {
      const status = booking.status?.toLowerCase();
      return status !== 'requested' && status !== 'searching';
    });

    // Build pending bookings map
    const mergedMap = new Map();
    const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
    const vendorId = vendorData._id || vendorData.id;

    requestedBookings.forEach(b => {
      const id = String(b._id || b.id);

      // Find distance for this vendor if available
      let distance = 'N/A';
      if (b.potentialVendors && vendorId) {
        const potentialVendor = b.potentialVendors.find(pv =>
          String(pv.vendorId?._id || pv.vendorId) === String(vendorId)
        );
        if (potentialVendor && potentialVendor.distance) {
          distance = `${potentialVendor.distance.toFixed(1)} km`;
        }
      }

      mergedMap.set(id, {
        ...b, // Spread first!
        id,
        serviceName: b.serviceName || b.serviceId?.title || 'New Booking Request',
        serviceCategory: b.serviceCategory || b.serviceId?.categoryId?.title || 'General Service',
        customerName: b.userId?.name || 'Customer',
        location: {
          address: b.address?.addressLine1 || 'Address not available',
          distance: distance
        },
        // Prioritize vendorEarnings, fallback to 90% of finalAmount if it's not a free plan (finalAmount > 0)
        price: (b.vendorEarnings > 0 ? b.vendorEarnings : (b.finalAmount > 0 ? b.finalAmount * 0.9 : 0)).toFixed(2),
        vendorEarnings: b.vendorEarnings, // Ensure it's explicitly passed
        timeSlot: {
          date: new Date(b.scheduledDate).toLocaleDateString(),
          time: b.scheduledTime || 'Time not set'
        },
        status: b.status,
        expiresAt: b.expiresAt || (b.createdAt && config ? new Date(new Date(b.createdAt).getTime() + (config.maxSearchTime || 5) * 60000).toISOString() : null)
      });
    });

    // Filter out locally ignored bookings
    const finalMap = new Map();
    mergedMap.forEach((value, key) => {
      if (!ignoredBookingIds.current.has(key)) {
        finalMap.set(key, value);
      }
    });

    // Merge with local storage to avoid losing real-time updates that haven't hit API yet
    const localPending = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
    const apiPending = Array.from(finalMap.values());
    const mergedPending = [...apiPending];

    localPending.forEach(localJob => {
      const id = String(localJob.id || localJob._id);
      if (!mergedPending.find(job => String(job.id || job._id) === id) && !ignoredBookingIds.current.has(id)) {

        const createdAt = localJob.createdAt ? new Date(localJob.createdAt).getTime() : Date.now();
        const expiresAt = localJob.expiresAt || (localJob.createdAt && config ? new Date(createdAt + (config.maxSearchTime || 5) * 60000).toISOString() : null);
        const isExpired = (expiresAt && new Date(expiresAt) <= new Date()) || (Date.now() - createdAt > 300000);

        const lowerStatus = String(localJob.status || '').toLowerCase();

        if (!isExpired && (lowerStatus === 'requested' || lowerStatus === 'searching')) {
          mergedPending.push({
            ...localJob,
            id,
            serviceName: localJob.serviceName || localJob.serviceId?.title || 'New Booking Request',
            serviceCategory: localJob.serviceCategory || localJob.serviceId?.categoryId?.title || 'General Service',
            customerName: localJob.customerName || localJob.userId?.name || 'Customer',
            expiresAt
          });
        }
      }
    });

    setPendingBookings(mergedPending);
    localStorage.setItem('vendorPendingJobs', JSON.stringify(mergedPending));

    // Update stats
    setStats({
      todayEarnings: apiStats.vendorEarnings || 0,
      activeJobs: apiStats.inProgressBookings || 0,
      pendingAlerts: mergedPending.length,
      workersOnline: apiStats.workersOnline || 0,
      totalEarnings: apiStats.vendorEarnings || 0,
      completedJobs: apiStats.completedBookings || 0,
      rating: apiStats.rating || 0,
    });

    // Recent jobs (non-requested)
    const recentJobsData = otherBookings.slice(0, 3).map(booking => ({
      id: booking._id,
      serviceType: booking.serviceId?.title || 'Service',
      customerName: booking.userId?.name || 'Customer',
      location: booking.address?.addressLine1 || 'Address not available',
      price: (booking.vendorEarnings > 0 ? booking.vendorEarnings : (booking.finalAmount ? booking.finalAmount * 0.9 : 0)).toFixed(2),
      vendorEarnings: booking.vendorEarnings,
      timeSlot: {
        date: new Date(booking.scheduledDate).toLocaleDateString(),
        time: booking.scheduledTime || 'Time not set'
      },
      status: booking.status,
      assignedTo: booking.workerId ? { name: booking.workerId.name } : null,
    }));
    setRecentJobs(recentJobsData);

    // Load vendor profile from localStorage (once)
    const profile = JSON.parse(localStorage.getItem('vendorData') || '{}');
    setVendorProfile({
      name: profile.name || 'Vendor Name',
      businessName: profile.businessName || 'Business Name',
      photo: profile.profilePhoto || null,
      service: profile.service || []
    });
  }, []);

  // Main data loader - useCallback to prevent recreation
  const loadDashboardData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      const response = await vendorDashboardService.getDashboardStats();
      processApiResponse(response);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(String(err.message || 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [processApiResponse]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Check for redirected state (to open a specific alert modal)
  useEffect(() => {
    if (location.state?.openBookingId && pendingBookings.length > 0) {
      const bId = String(location.state.openBookingId);
      const booking = pendingBookings.find(b => String(b.id || b._id) === bId);
      if (booking) {
        setActiveAlertBookings(prev => {
          if (prev.find(p => String(p.id || p._id) === bId)) return prev;
          return [...prev, booking];
        });
        // Clear state to avoid reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, pendingBookings, navigate]);

  // Listen for real-time updates via window events (dispatched by useAppNotifications)
  useEffect(() => {
    const handleUpdate = () => {
      loadDashboardData(false); // false = don't show spinner for background refresh
    };

    // Ask for notification permission and register FCM
    registerFCMToken('vendor', true).catch(err => console.error('FCM registration failed:', err));

    // Listen for custom dashboard events from SocketContext
    const handleShowAlert = (e) => {
      // e.detail contains the new booking job
      if (e.detail) {
        // Also add to pending if not present
        setPendingBookings(prev => {
          if (prev.find(b => b.id === e.detail.id)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleRemoveBooking = (e) => {
      if (e.detail?.id) {
        const idToRemove = String(e.detail.id);

        // Add to ignored list so it doesn't come back on next fetch
        ignoredBookingIds.current.add(idToRemove);

        // Remove from pending bookings state immediately
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));

        // Remove from recent jobs state
        setRecentJobs(prev => prev.filter(b => String(b.id || b._id) !== idToRemove));

        // Remove from localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updatedPending = pendingJobs.filter(job => String(job.id || job._id) !== idToRemove);
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updatedPending));
      }
    };

    window.addEventListener('vendorJobsUpdated', handleUpdate);
    window.addEventListener('vendorStatsUpdated', handleUpdate);
    window.addEventListener('showDashboardBookingAlert', handleShowAlert);
    window.addEventListener('removeVendorBooking', handleRemoveBooking);

    return () => {
      window.removeEventListener('vendorJobsUpdated', handleUpdate);
      window.removeEventListener('vendorStatsUpdated', handleUpdate);
      window.removeEventListener('showDashboardBookingAlert', handleShowAlert);
      window.removeEventListener('removeVendorBooking', handleRemoveBooking);
    };
  }, [loadDashboardData]);


  // Alert Action Handlers
  const handleAcceptAlert = async (bookingId) => {
    try {
      const response = await acceptBooking(bookingId);
      if (response.success) {
        toast.success('Booking accepted successfully!');
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== String(bookingId)));

        // Sync localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(bookingId));
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bookingId } }));
        window.dispatchEvent(new Event('vendorStatsUpdated'));
      }
    } catch (error) {
      console.error('Error accepting:', error);
      toast.error('Failed to accept booking');
    }
  };

  const handleRejectAlert = async (bookingId) => {
    try {
      const response = await rejectBooking(bookingId);
      if (response.success) {
        toast.success('Booking rejected');
        setPendingBookings(prev => prev.filter(b => String(b.id || b._id) !== String(bookingId)));

        // Sync localStorage
        const pendingJobs = JSON.parse(localStorage.getItem('vendorPendingJobs') || '[]');
        const updated = pendingJobs.filter(b => String(b.id || b._id) !== String(bookingId));
        localStorage.setItem('vendorPendingJobs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: bookingId } }));
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject booking');
    }
  };

  const handleAssignAlert = async (bookingId) => {
    try {
      const response = await assignWorker(bookingId, 'SELF');
      if (response?.success !== false) {
        toast.success('Job assigned to you');
        navigate(`/vendor/booking/${bookingId}`);
      }
    } catch (err) {
      console.error('Error assigning job:', err);
      toast.error('Failed to assign job');
      navigate(`/vendor/booking/${bookingId}`);
    }
  };

  // Memoize quickActions to prevent recreation on every render
  const quickActions = useMemo(() => [
    {
      title: 'Active Jobs',
      icon: FiBriefcase,
      color: themeColors?.brand?.blue || '#2563EB',
      path: '/vendor/jobs',
      count: stats.activeJobs,
      subtitle: `${stats.activeJobs} running`,
    },
    {
      title: 'My Ratings',
      icon: FiStar,
      color: '#F59E0B',
      path: '/vendor/ratings',
      count: stats.rating > 0 ? stats.rating.toFixed(1) : '—',
      subtitle: 'Customer feedback',
    },
    {
      title: 'Wallet',
      icon: FaWallet,
      color: '#F59E0B',
      path: '/vendor/wallet',
      subtitle: `₹${stats.totalEarnings.toLocaleString()} total`,
    },
  ], [stats.activeJobs, stats.rating, stats.totalEarnings]);

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    const statusColors = {
      'accepted': '#3B82F6',
      'confirmed': '#10B981',
      'assigned': '#8B5CF6',
      'journey_started': '#F59E0B',
      'visited': '#F59E0B',
      'in_progress': '#F59E0B',
      'work_done': '#10B981',
      'completed': '#10B981',
      'worker_paid': '#06B6D4',
      'settlement_pending': '#F97316',
    };
    return statusColors[s] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const s = String(status).toLowerCase();
    const labels = {
      'requested': 'Requested',
      'searching': 'Searching',
      'accepted': 'Accepted',
      'confirmed': 'Confirmed',
      'assigned': 'Assigned',
      'journey_started': 'On the way',
      'visited': 'Visited',
      'in_progress': 'In Progress',
      'work_done': 'Work Done',
      'completed': 'Completed',
      'worker_paid': 'Payment Done',
      'settlement_pending': 'Settlement',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected'
    };
    return labels[s] || status;
  };

  // Show loading state
  if (loading) {
    return <LogoLoader />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center relative">
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
        <div className="text-center px-6 relative z-10">
          <p className="text-5xl mb-4" aria-hidden>⚠️</p>
          <h2 className="text-neutral-900 text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen pb-20 relative bg-[#f8fafc]">
      {/* Top right background accent (like in the design) */}
      <div className="fixed top-0 right-0 w-[80vw] h-[400px] bg-gradient-to-b from-[#e0f7fa] to-transparent rounded-bl-full opacity-60 pointer-events-none z-0" aria-hidden />
      
      <div className="relative z-10">
        <Header title="" showBack={false} notificationCount={stats.pendingAlerts} />
      </div>

      <main className="pt-0 relative z-10">
        {/* Profile Card Section */}
        {/* Profile Card Section */}
        <div className="px-4 pt-4 pb-2 relative z-10">
          <div
            className="group rounded-[32px] p-6 cursor-pointer active:scale-[0.98] transition-all duration-300 relative overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            onClick={() => navigate('/vendor/profile')}
          >
            {/* Top Right Curved Gradient */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-bl from-[#e0f7fa] to-transparent rounded-full opacity-60 pointer-events-none" aria-hidden />

            <div className="flex items-center justify-between relative z-10">
              {/* Profile Info (Left) */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[14px] text-gray-500 font-medium mb-1 tracking-tight">Good Morning,</p>
                <h2 className="text-[22px] font-bold text-gray-900 truncate mb-1.5 leading-tight tracking-tight">
                  {vendorProfile.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-3">
                  <FiBriefcase className="w-4 h-4 text-gray-400" />
                  <p className="text-[13px] text-gray-600 truncate font-medium">
                    {vendorProfile.businessName}
                  </p>
                </div>
              </div>

              {/* Profile Image & Badge (Right) */}
              <div className="flex flex-col items-center flex-shrink-0 relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-[3px] border-[#00bfa5] p-0.5 mb-2 shadow-sm relative z-10 bg-white">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                    {vendorProfile.photo ? (
                      <img
                        src={vendorProfile.photo}
                        alt={vendorProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="w-8 h-8 text-gray-400 mt-2 mx-auto" />
                    )}
                  </div>
                </div>
                {/* Verified Badge positioned slightly overlapping */}
                <div className="absolute -bottom-1 flex items-center justify-center gap-1 px-2.5 py-1 bg-[#e6f7f5] rounded-full border border-white shadow-sm z-20 whitespace-nowrap">
                  <FiCheckCircle className="w-3 h-3 text-[#00bfa5]" />
                  <span className="text-[9px] font-bold text-[#00bfa5] uppercase tracking-wider">Verified Partner</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incomplete Profile Prompt */}
        {(!vendorProfile.service || vendorProfile.service.length === 0) && (
          <div className="px-4 pt-2 -mb-2">
            <div
              onClick={() => navigate('/vendor/profile')}
              className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r shadow-sm cursor-pointer hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiClock className="h-5 w-5 text-orange-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-bold text-orange-700">Profile Incomplete</p>
                  <p className="text-sm text-orange-600">
                    Add services to your profile to start receiving bookings.
                  </p>
                </div>
                <div className="ml-auto">
                  <FiArrowRight className="h-4 w-4 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Optimized Component */}
        <StatsCards stats={stats} />

        {/* Content Section (below gradient) */}
        <div className="px-4 py-4 space-y-4">
          {/* Pending Booking Alerts - Optimized Component */}
          <PendingBookings
            bookings={pendingBookings}
            maxSearchTimeMins={globalConfig.maxSearchTime}
            setPendingBookings={setPendingBookings}
            setActiveAlertBooking={(booking) => {
              // Dispatch to global alert via CustomEvent
              window.dispatchEvent(new CustomEvent('showDashboardBookingAlert', { detail: booking }));
            }}
          />

          {/* Performance Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-black text-gray-900 tracking-tight">Performance Overview</h2>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                This Month <FiChevronRight className="w-3 h-3 rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Completed Jobs Card */}
              <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] transition-shadow">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00bfa5] shadow-sm"></span>
                    <p className="text-[12px] font-bold text-gray-700">Completed Jobs</p>
                  </div>
                  <p className="text-[28px] font-black text-gray-900 leading-none">{stats.completedJobs}</p>
                </div>
                <div className="mt-8 h-16 w-full relative">
                  {/* Simple SVG Line Chart Placeholder matching design */}
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,30 L15,25 L30,28 L45,15 L60,20 L75,10 L90,12 L100,2" fill="none" stroke="#00bfa5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M0,30 L15,25 L30,28 L45,15 L60,20 L75,10 L90,12 L100,2 L100,40 L0,40 Z" fill="url(#grad1)" opacity="0.3" />
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00bfa5', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#00bfa5', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <circle cx="0" cy="30" r="2.5" fill="#00bfa5" />
                    <circle cx="15" cy="25" r="2.5" fill="#00bfa5" />
                    <circle cx="30" cy="28" r="2.5" fill="#00bfa5" />
                    <circle cx="45" cy="15" r="2.5" fill="#00bfa5" />
                    <circle cx="60" cy="20" r="2.5" fill="#00bfa5" />
                    <circle cx="75" cy="10" r="2.5" fill="#00bfa5" />
                    <circle cx="90" cy="12" r="2.5" fill="#00bfa5" />
                    <circle cx="100" cy="2" r="2.5" fill="#00bfa5" />
                  </svg>
                  <div className="flex justify-between w-full text-[8px] font-bold text-gray-400 mt-2 px-1">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                  </div>
                </div>
              </div>

              {/* Rating Card */}
              <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] transition-shadow">
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <FiStar className="w-3.5 h-3.5 text-[#00bfa5]" fill="#00bfa5" />
                    <p className="text-[12px] font-bold text-gray-700">Average Rating</p>
                  </div>
                  <p className="text-[28px] font-black text-gray-900 leading-none">{stats.rating > 0 ? stats.rating.toFixed(1) : '4.3'}</p>
                </div>
                <div className="mt-8 h-16 w-full relative">
                  {/* Simple SVG Line Chart Placeholder matching design */}
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,35 L15,25 L30,20 L45,15 L60,12 L75,14 L90,5 L100,2" fill="none" stroke="#00bfa5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M0,35 L15,25 L30,20 L45,15 L60,12 L75,14 L90,5 L100,2 L100,40 L0,40 Z" fill="url(#grad2)" opacity="0.3" />
                    <defs>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00bfa5', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#00bfa5', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <circle cx="0" cy="35" r="2.5" fill="#00bfa5" />
                    <circle cx="15" cy="25" r="2.5" fill="#00bfa5" />
                    <circle cx="30" cy="20" r="2.5" fill="#00bfa5" />
                    <circle cx="45" cy="15" r="2.5" fill="#00bfa5" />
                    <circle cx="60" cy="12" r="2.5" fill="#00bfa5" />
                    <circle cx="75" cy="14" r="2.5" fill="#00bfa5" />
                    <circle cx="90" cy="5" r="2.5" fill="#00bfa5" />
                    <circle cx="100" cy="2" r="2.5" fill="#00bfa5" />
                  </svg>
                  <div className="flex justify-between w-full text-[8px] font-bold text-gray-400 mt-2 px-1">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Jobs - List View */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-black text-gray-900 tracking-tight">Active Jobs</h2>
              {recentJobs.length > 0 && (
                <button
                  onClick={() => navigate('/vendor/jobs')}
                  className="font-bold text-[13px] text-[#00bfa5] hover:text-[#009b86] transition-colors"
                >
                  View All
                </button>
              )}
            </div>
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job, index) => {
                  const statusColors = {
                    'Completed': '#10b981',
                    'Canceled': '#ef4444',
                    'Ongoing': '#3b82f6',
                  };
                  
                  const label = getStatusLabel(job.status);
                  // Match border color based on status or index
                  const dummyBorderColors = ['#00bfa5', '#ef4444', '#f59e0b', '#0ea5e9'];
                  const accentColor = statusColors[label] || dummyBorderColors[index % dummyBorderColors.length];

                  return (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/vendor/booking/${job.id}`)}
                      className="bg-white rounded-[16px] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.03)] cursor-pointer active:scale-[0.98] transition-all duration-300 relative overflow-hidden border border-gray-100 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                    >
                      {/* Left accent border matching design */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ background: accentColor }}
                      />

                      <div className="px-4 py-4 pl-5">
                        <div className="flex items-center gap-4">
                          {/* Profile Image Circle (Left) */}
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-[#b2dfdb] bg-transparent">
                            <FiUser className="w-5 h-5 text-[#00bfa5]" strokeWidth={1.5} />
                          </div>

                          {/* Main Content (Middle) */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[14px] font-bold text-gray-900 truncate tracking-tight">{job.customerName}</p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#e6f7f5] text-[#00bfa5] tracking-wide border border-[#00bfa5]/20">
                                {job.serviceType || 'Service'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mb-2">
                              <FiMapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-[12px] text-gray-500 font-medium truncate">{job.location}</span>
                            </div>

                            <div className="flex items-center gap-3 mt-1">
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${accentColor}15`, color: accentColor }}
                              >
                                {label}
                              </span>
                              
                              <div className="flex items-center gap-1 text-gray-400">
                                <FiClock className="w-3 h-3" />
                                <span className="text-[11px] font-medium">{job.time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Navigate Button (Right) */}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-[#b2dfdb] bg-transparent transition-colors hover:bg-[#e6f7f5]">
                            <FiChevronRight className="w-5 h-5 text-[#00bfa5]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="bg-white rounded-xl p-6 shadow-md text-center"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <FiBriefcase className="w-12 h-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-sm text-gray-600 mb-1">No active jobs</p>
                <p className="text-xs text-gray-500">New bookings will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
});

export default Dashboard;
