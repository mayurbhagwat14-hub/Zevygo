/**
 * Contextual booking status labels — delivery vs on-site (mirrors Backend/utils/bookingStatusLabels.js).
 */

const DELIVERY_SLUGS = new Set(['tiffin', 'food', 'meals', 'catering']);

export const normalizeFulfillment = (type) =>
  String(type || 'ON_SITE').toUpperCase() === 'DELIVERY' ? 'DELIVERY' : 'ON_SITE';

export const resolveServiceFulfillmentType = ({ category, booking } = {}) => {
  if (booking?.serviceFulfillmentType) {
    return normalizeFulfillment(booking.serviceFulfillmentType);
  }
  if (category?.serviceFulfillmentType) {
    return normalizeFulfillment(category.serviceFulfillmentType);
  }
  const slug = String(category?.slug || booking?.categorySlug || '').toLowerCase();
  if (DELIVERY_SLUGS.has(slug)) return 'DELIVERY';
  return 'ON_SITE';
};

const STATUS_LABELS = {
  DELIVERY: {
    searching: 'Finding provider',
    requested: 'Waiting for provider',
    awaiting_payment: 'Pay advance to confirm',
    confirmed: 'Order confirmed',
    accepted: 'Order accepted',
    assigned: 'Provider assigned',
    journey_started: 'Out for delivery',
    visited: 'Arrived at your door',
    in_progress: 'Handing over',
    work_done: 'Delivered — pay balance',
    completed: 'Order complete',
    cancelled: 'Cancelled',
    rejected: 'Declined'
  },
  ON_SITE: {
    searching: 'Finding provider',
    requested: 'Waiting for provider',
    awaiting_payment: 'Pay advance to confirm',
    confirmed: 'Booking confirmed',
    accepted: 'Booking accepted',
    assigned: 'Provider assigned',
    journey_started: 'Provider on the way',
    visited: 'Provider arrived',
    in_progress: 'Service in progress',
    work_done: 'Work done — pay balance',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Declined'
  }
};

const VENDOR_ACTION_LABELS = {
  DELIVERY: {
    startJourney: 'Start Delivery',
    arrived: 'Arrived at customer',
    workDone: 'Mark Delivered'
  },
  ON_SITE: {
    startJourney: 'Start Journey',
    arrived: "I've Arrived",
    workDone: 'Mark Work Done'
  }
};

export const getStatusLabel = (status, fulfillmentType = 'ON_SITE') => {
  const key = normalizeFulfillment(fulfillmentType);
  const normalized = String(status || '').toLowerCase();
  return STATUS_LABELS[key][normalized]
    || STATUS_LABELS.ON_SITE[normalized]
    || String(status || 'pending').replace(/_/g, ' ');
};

export const getVendorActionLabels = (fulfillmentType = 'ON_SITE') =>
  VENDOR_ACTION_LABELS[normalizeFulfillment(fulfillmentType)];

export const isLiveTrackingStatus = (status) =>
  ['journey_started', 'visited'].includes(String(status || '').toLowerCase());

export const getTrackingHeadline = (status, fulfillmentType = 'ON_SITE') => {
  const key = normalizeFulfillment(fulfillmentType);
  const s = String(status || '').toLowerCase();
  if (s === 'journey_started') {
    return key === 'DELIVERY' ? 'Out for delivery' : 'On the way';
  }
  if (s === 'visited') {
    return key === 'DELIVERY' ? 'Arrived with your order' : 'Provider has arrived';
  }
  return getStatusLabel(status, fulfillmentType);
};
