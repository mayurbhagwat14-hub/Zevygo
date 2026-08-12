import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMapPin, FiCalendar, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { bookingService } from '../../../../services/bookingService';
import NotificationBell from '../../components/common/NotificationBell';
import { Badge, Button, EmptyState, SkeletonCard } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const STATUS_BORDER = {
  confirmed: 'border-l-success-500',
  in_progress: 'border-l-primary-500',
  'in-progress': 'border-l-primary-500',
  journey_started: 'border-l-secondary-500',
  visited: 'border-l-secondary-500',
  completed: 'border-l-primary-600',
  cancelled: 'border-l-error-500',
  rejected: 'border-l-error-500',
  awaiting_payment: 'border-l-warning-500',
};

const getStatusBorder = (status) =>
  STATUS_BORDER[String(status || '').toLowerCase()] || 'border-l-neutral-300';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filter !== 'all') {
          params.status = filter;
        }
        const response = await bookingService.getUserBookings(params);
        if (response.success) {
          setBookings(response.data || []);
        } else {
          toast.error(response.message || 'Failed to load bookings');
          setBookings([]);
        }
      } catch {
        toast.error('Failed to load bookings. Please try again.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
    window.addEventListener('userBookingsUpdated', loadBookings);
    return () => window.removeEventListener('userBookingsUpdated', loadBookings);
  }, [filter]);

  const handleBookingClick = (booking) => {
    navigate(`/user/booking/${booking._id || booking.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAddressString = (address) => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object') {
      return [address.addressLine1, address.addressLine2, address.city].filter(Boolean).join(', ');
    }
    return 'Detailed Address';
  };

  const filterTabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen pb-24 relative bg-neutral-50">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: gradients.pageSoft }}
        aria-hidden
      />

      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">My Bookings</h1>
          </div>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 relative">
            <NotificationBell />
          </div>
        </header>

        <div className="bg-white/90 backdrop-blur-md border-b border-neutral-100 sticky top-[61px] z-20 shadow-sm">
          <div className="flex overflow-x-auto px-4 py-3 gap-2.5 no-scrollbar scroll-smooth">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                  filter === tab.id
                    ? 'border-transparent bg-primary-600 text-white shadow-md shadow-primary-500/25 active:scale-95'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="px-4 py-5 max-w-lg mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={FiClock}
              title="No bookings found"
              message={
                filter === 'all'
                  ? "You haven't booked any services yet. Explore categories on home to get started."
                  : `You don't have any ${filter.replace('-', ' ')} bookings right now.`
              }
              actionLabel="Browse services"
              onAction={() => navigate('/user/home')}
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
              className="space-y-4"
            >
              {bookings.map((booking) => {
                const statusKey = String(booking.status || '').toLowerCase().replace(/-/g, '_');
                return (
                  <motion.div
                    key={booking._id || booking.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
                    }}
                    onClick={() => handleBookingClick(booking)}
                    className={`group relative bg-white rounded-2xl p-5 border border-neutral-200 border-l-4 shadow-sm hover:shadow-md hover:border-primary-200 active:scale-[0.99] transition-all duration-300 cursor-pointer ${getStatusBorder(booking.status)}`}
                  >
                    <div className="flex items-start justify-between mb-4 border-b border-neutral-100 pb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-1.5">
                          #{booking.bookingNumber || (booking._id || booking.id).substring(0, 8)}
                        </p>
                        {booking.serviceCategory && (
                          <Badge variant="primary" size="sm" className="mb-1 uppercase tracking-wide">
                            {booking.serviceCategory}
                          </Badge>
                        )}
                        <h3 className="text-lg font-bold text-neutral-800 leading-tight line-clamp-2 group-hover:text-primary-700 transition-colors mt-1">
                          {booking.serviceName || 'Service Request'}
                        </h3>
                        {booking.bookedItems?.length > 0 && (
                          <p className="text-xs text-neutral-400 line-clamp-1 mt-1">
                            {booking.bookedItems.map((item) => item.card?.title || item.title).join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge variant="status" status={statusKey} size="sm" className="shrink-0 uppercase" />
                    </div>

                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-4 mb-5 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
                      <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                        <FiCalendar className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Slot</p>
                        <p className="text-sm font-bold text-neutral-700">
                          {formatDate(booking.scheduledDate)}
                          <span className="text-neutral-300 mx-1">•</span>
                          {booking.scheduledTime || booking.timeSlot?.start || 'N/A'}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                        <FiMapPin className="w-4 h-4 text-error-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Location</p>
                        <p className="text-sm font-medium text-neutral-700 truncate">
                          {getAddressString(booking.address)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <div>
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">
                          Total amount
                        </p>
                        <p className="text-xl font-bold text-neutral-900">
                          ₹{(booking.finalAmount || booking.totalAmount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="pointer-events-none"
                        icon={FiChevronRight}
                        iconPosition="right"
                      >
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyBookings;
