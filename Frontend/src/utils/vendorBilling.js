/**
 * Admin category flag snapshotted on booking.
 * Undefined/null treated as true (legacy bookings keep bill prepare).
 */
export const canPrepareVendorBill = (booking) => booking?.allowVendorBilling !== false;
