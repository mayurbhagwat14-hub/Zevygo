import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { colors, gradients } from '../../../../theme';
import {
  FiCheckCircle,
  FiMapPin,
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiArrowRight,
  FiArrowLeft,
  FiBell,
  FiXCircle
} from 'react-icons/fi';
import { bookingService } from '../../../../services/bookingService';
import NotificationBell from '../../components/common/NotificationBell';
import ConfirmDialog from '../../../../components/common/ConfirmDialog';
import { Button, Badge, Card, Loader } from '../../../../components/ui';

// Inline Searching Animation Component
const SearchingAnimation = () => {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(${colors.neutral[900]} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <div
          className="absolute inset-0 rounded-full border-2 border-primary-500/20 animate-ping"
          style={{ animationDuration: '3s' }}
        />
        <div
          className="absolute inset-4 rounded-full border border-primary-500/40 animate-ping"
          style={{ animationDuration: '3s', animationDelay: '0.6s' }}
        />
        <div
          className="absolute inset-0 rounded-full animate-spin opacity-30"
          style={{
            background: `conic-gradient(transparent 180deg, ${colors.primary[500]})`,
            animationDuration: '4s',
          }}
        />
        <div className="relative z-10 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-1">
          <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden bg-primary-50">
            <div className="w-3 h-3 rounded-full shadow-lg animate-pulse bg-primary-500" />
          </div>
        </div>
        <div className="absolute top-8 right-8 w-2 h-2 rounded-full animate-bounce opacity-50 bg-secondary-500" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-6 left-6 w-2 h-2 rounded-full animate-bounce opacity-50 bg-accent-400" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="text-center relative z-20">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Searching nearby experts</h3>
        <p className="text-neutral-500 text-sm max-w-[240px] mx-auto leading-relaxed">
          Searching within 10km radius{dots}
        </p>
      </div>

      <div className="mt-4">
        <div className="px-4 py-1.5 bg-neutral-50 rounded-full border border-neutral-100 text-xs font-medium text-neutral-400">
          Process runs in background
        </div>
      </div>
    </div>
  );
};

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(!location.state?.noVendorsFound); // Respect passed state
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getById(id);
        if (response.success) {
          const data = { ...response.data };
          // Calculate notional display values for plan_benefit
          if (data.paymentMethod === 'plan_benefit') {
            if (!data.tax) data.tax = (data.basePrice || 0) * 0.18;
            if (!data.visitingCharges && !data.visitationFee) data.visitingCharges = 49;
          }
          setBooking(data);

          // Check if vendor is already assigned
          const currentStatus = data.status?.toLowerCase();
          if (data.vendorId || (currentStatus !== 'requested' && currentStatus !== 'searching')) {
            setIsSearching(false);
          }
        } else {
          toast.error(response.message || 'Booking not found');
          navigate('/user/my-bookings');
        }
      } catch (error) {
        toast.error('Failed to load booking details');
        navigate('/user/my-bookings');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBooking();
    }
  }, [id, navigate]);

  // Poll for vendor acceptance
  useEffect(() => {
    if (!isSearching || !id) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await bookingService.getById(id);
        if (response.success) {
          const updatedBooking = { ...response.data };

          // Calculate notional display values for plan_benefit
          if (updatedBooking.paymentMethod === 'plan_benefit') {
            if (!updatedBooking.tax) updatedBooking.tax = (updatedBooking.basePrice || 0) * 0.18;
            if (!updatedBooking.visitingCharges && !updatedBooking.visitationFee) updatedBooking.visitingCharges = 49;
          }

          setBooking(updatedBooking);
          // If vendor accepted or status changed
          const currentStatus = updatedBooking.status?.toLowerCase();
          if (updatedBooking.vendorId || (currentStatus !== 'requested' && currentStatus !== 'searching')) {
            setIsSearching(false);
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isSearching, id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAddressString = (address) => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object') {
      return `${address.addressLine1 || ''}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader message="Loading booking details…" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Booking not found</p>
          <Button onClick={() => navigate('/user/my-bookings')}>Go to My Bookings</Button>
        </div>
      </div>
    );
  }

  const handleViewDetails = () => {
    navigate(`/user/booking/${booking._id || booking.id}`);
  };

  const handleGoHome = () => {
    navigate('/user', { replace: true });
  };

  const handleCancelBooking = async () => {
    try {
      setLoading(true);
      await bookingService.cancel(booking._id || booking.id, { reason: 'Cancelled during uncertain vendor search' });
      toast.success('Booking cancelled successfully');
      navigate('/user');
    } catch (error) {
      console.error(error);
      toast.error('Failed to cancel booking');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 relative bg-neutral-50" style={{ background: gradients.pageSoft }}>
      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="icon"
              icon={FiArrowLeft}
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="bg-white shadow-sm border border-neutral-100"
            />
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Booking Sent</h1>
          </div>
          <NotificationBell />
        </header>

        <main className="px-4 py-6">
          {/* Searching Animation - Show at top when searching for vendor */}
          {isSearching && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-4 overflow-hidden">
              <SearchingAnimation />
            </div>
          )}

          {/* Success Icon - Show when confirmed */}
          {!isSearching && ['confirmed', 'assigned', 'journey_started', 'work_in_progress', 'visited', 'work_done', 'completed'].includes(booking?.status?.toLowerCase()) && (
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <FiCheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Booking Confirmed!</h1>
              <p className="text-sm text-gray-600 text-center">
                Your booking has been confirmed. We'll send you updates via SMS.
              </p>
            </div>
          )}

          {/* Request Sent Icon - Show when status is requested but searching animation is stopped */}
          {!isSearching && booking?.status?.toLowerCase() === 'requested' && (
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
                <FiBell className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2 italic tracking-tight">REQUEST SENT!</h1>
              <p className="text-sm text-gray-500 text-center max-w-[260px] font-medium leading-relaxed">
                Your request has been broadcasted to all nearby experts. We'll notify you the moment someone accepts.
              </p>
            </div>
          )}

          {/* Failure Icon - Show when expired/cancelled/rejected */}
          {!isSearching && ['expired', 'cancelled', 'rejected', 'failed', 'timeout'].includes(booking?.status?.toLowerCase()) && (
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <FiXCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">No Expert Found</h1>
              <p className="text-sm text-gray-500 text-center max-w-[260px] mb-6">
                We couldn't find a nearby expert for your request at this moment.
              </p>
              <button
                onClick={() => navigate('/user')}
                className="px-8 py-3 bg-primary-500 text-white rounded-xl font-bold shadow-brand active:scale-95 transition-all flex items-center gap-2"
              >
                <FiArrowRight className="w-5 h-5" />
                Search Again
              </button>
            </div>
          )}

          {/* Booking ID Card */}
          <Card className="mb-4 !rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Booking ID</p>
                <p className="text-base font-bold text-neutral-900">
                  {booking.bookingNumber || booking._id || booking.id}
                </p>
              </div>
              <Badge
                variant="status"
                status={
                  isSearching
                    ? 'searching'
                    : booking?.status?.toLowerCase() === 'requested'
                      ? 'requested'
                      : booking?.status || 'confirmed'
                }
              />
            </div>
          </Card>

          {/* Service Details Card */}
          <Card className="mb-4 !rounded-2xl">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Service Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-50">
                  <FiMapPin className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 mb-1">Service Address</p>
                  <p className="text-sm text-neutral-700">{getAddressString(booking.address)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-50">
                  <FiCalendar className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 mb-1">Date & Time</p>
                  <p className="text-sm text-neutral-700">
                    {formatDate(booking.scheduledDate)} •{' '}
                    {booking.scheduledTime || booking.timeSlot?.start || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Service Summary Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-4">
            <h3 className="text-base font-bold text-black mb-4">Order Summary</h3>
            <div className="space-y-3">
              {/* Service Category */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-primary-50">
                  {booking.categoryIcon ? (
                    <img src={booking.categoryIcon} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <FiPackage className="w-4 h-4 text-primary-500" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Category</p>
                  <p className="text-sm font-bold text-gray-800">{booking.serviceCategory || booking.serviceName || 'Service'}</p>
                </div>
              </div>

              {/* Brand */}
              {(() => {
                const brandName = booking.brandName || booking.bookedItems?.[0]?.brandName;
                const brandIcon = booking.brandIcon || booking.bookedItems?.[0]?.brandIcon;
                if (!brandName) return null;
                return (
                  <div className="flex items-center gap-3 pt-3 border-t border-dashed border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                      {brandIcon ? (
                        <img src={brandIcon} alt={brandName} className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-base font-black text-slate-400">{brandName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand</p>
                      <p className="text-sm font-bold text-gray-800">{brandName}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Service Cards */}
              {booking.bookedItems && booking.bookedItems.length > 0 ? (
                <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Services Booked</p>
                  {booking.bookedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-gray-50 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded border text-primary-600 bg-primary-50 border-primary-100">
                            ×{item.quantity}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{item.card?.title || 'Service'}</span>
                        </div>
                        {item.card?.subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-8 line-clamp-1">{item.card.subtitle}</p>}
                        {item.card?.duration && <p className="text-xs text-gray-400 mt-0.5 ml-8">⏱ {item.card.duration}</p>}
                      </div>
                      <span className="text-sm font-bold text-gray-900 ml-3 shrink-0">₹{((item.card?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Payment Summary - Professional Card */}
          <div className="bg-white border-2 border-neutral-100 rounded-2xl p-5 mb-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500" />

            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${booking.paymentMethod === 'plan_benefit' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                {booking.paymentMethod === 'plan_benefit' ? (
                  <FiPackage className="w-5 h-5 text-amber-600" />
                ) : (
                  <FiDollarSign className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment Summary</h3>
            </div>

            <div className="space-y-3">
              {/* Base Price */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Base Price</span>
                {booking.paymentMethod === 'plan_benefit' ? (
                  <div className="flex items-center gap-2">
                    <span className="line-through text-slate-400 text-xs">₹{(booking.basePrice || 0).toLocaleString('en-IN')}</span>
                    <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FREE ✓</span>
                  </div>
                ) : (
                  <span className="font-medium text-slate-900">₹{(booking.basePrice || 0).toLocaleString('en-IN')}</span>
                )}
              </div>

              {/* Discount */}
              {booking.paymentMethod !== 'plan_benefit' && booking.discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 font-medium">Discount</span>
                  <span className="font-medium text-green-600">-₹{booking.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Tax */}
              {(booking.tax > 0 || booking.paymentMethod === 'plan_benefit') && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">GST (18%)</span>
                  {booking.paymentMethod === 'plan_benefit' ? (
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400 text-xs">₹{(booking.tax || 0).toLocaleString('en-IN')}</span>
                      <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FREE ✓</span>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-700">₹{(booking.tax || 0).toLocaleString('en-IN')}</span>
                  )}
                </div>
              )}

              {/* Convenience Fee */}
              {(booking.visitingCharges > 0 || booking.visitationFee > 0 || booking.paymentMethod === 'plan_benefit') && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Convenience Fee</span>
                  {booking.paymentMethod === 'plan_benefit' ? (
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400 text-xs">₹{(booking.visitingCharges || booking.visitationFee || 0).toLocaleString('en-IN')}</span>
                      <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">FREE ✓</span>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-700">₹{(booking.visitingCharges || booking.visitationFee || 0).toLocaleString('en-IN')}</span>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-slate-200 pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">Total Paid</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{(booking.paymentMethod === 'plan_benefit' ? 0 : (booking.finalAmount || booking.totalAmount || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Success Badge */}
            {(booking.paymentId || booking.paymentMethod === 'plan_benefit') && (
              <div className={`mt-4 pt-3 border-t border-dashed ${booking.paymentMethod === 'plan_benefit' ? 'border-amber-200' : 'border-slate-200'}`}>
                <div className={`flex items-center gap-2 border rounded-lg p-3 ${booking.paymentMethod === 'plan_benefit' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-200'}`}>
                  <FiCheckCircle className={`w-5 h-5 shrink-0 ${booking.paymentMethod === 'plan_benefit' ? 'text-amber-600' : 'text-green-600'}`} />
                  <div>
                    <p className={`text-sm font-bold ${booking.paymentMethod === 'plan_benefit' ? 'text-amber-700' : 'text-green-700'}`}>
                      {booking.paymentMethod === 'plan_benefit' ? 'Membership Benefit Applied' : 'Payment Successful'}
                    </p>
                    {booking.paymentId && <p className="text-xs text-green-600">ID: {booking.paymentId}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isSearching && (
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={() => setConfirmDialog(true)}
                className="!border-error-200 !text-error-600 hover:!bg-error-50"
              >
                Cancel Booking Request
              </Button>
            )}

            <Button
              variant="primary"
              fullWidth
              size="xl"
              icon={FiArrowRight}
              iconPosition="right"
              onClick={handleViewDetails}
            >
              View Full Details
            </Button>
            <Button variant="outline" fullWidth size="xl" onClick={handleGoHome}>
              Back to Home
            </Button>
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking Request"
        message="Are you sure you want to cancel this booking search?"
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Keep It"
        type="danger"
      />
    </div>
  );
};

export default BookingConfirmation;
