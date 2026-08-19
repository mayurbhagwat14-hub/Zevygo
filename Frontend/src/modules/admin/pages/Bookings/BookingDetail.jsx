import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiUser, FiMapPin, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { adminBookingService } from '../../../../services/adminBookingService';
import BookingListingOrigin from '../../components/BookingListingOrigin';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminBookingService.getBookingById(id);
        if (res.success) setBooking(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <p className="text-sm font-bold text-neutral-700">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-primary-600"
      >
        <FiArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Order</p>
            <h1 className="text-lg font-black text-neutral-900">#{booking.bookingNumber}</h1>
            <p className="text-xs text-neutral-500 mt-0.5 capitalize">{booking.status?.replace(/_/g, ' ')}</p>
          </div>
          <span className="text-sm font-black text-neutral-900">₹{booking.finalAmount?.toLocaleString()}</span>
        </div>

        <BookingListingOrigin booking={booking} />

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Customer</p>
            <p className="font-bold text-neutral-900 flex items-center gap-1"><FiUser className="w-3.5 h-3.5" />{booking.userId?.name || '—'}</p>
            <p className="text-neutral-500 mt-0.5">{booking.userId?.phone}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Vendor</p>
            <p className="font-bold text-neutral-900">{booking.vendorId?.name || booking.vendorId?.businessName || 'Unassigned'}</p>
            <p className="text-neutral-500 mt-0.5">{booking.vendorId?.phone}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Service</p>
            <p className="font-bold text-neutral-900">{booking.serviceName}</p>
            <p className="text-neutral-500 mt-0.5">{booking.serviceCategory}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Schedule</p>
            <p className="font-bold text-neutral-900 flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5" />
              {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : '—'}
            </p>
            <p className="text-neutral-500 mt-0.5">{booking.scheduledTime}</p>
          </div>
        </div>

        {booking.address && (
          <div className="text-xs text-neutral-600 flex items-start gap-2">
            <FiMapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
            <span>
              {booking.address.addressLine1}
              {booking.address.city ? `, ${booking.address.city}` : ''}
              {booking.address.pincode ? ` ${booking.address.pincode}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
