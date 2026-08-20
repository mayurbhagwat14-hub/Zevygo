/**
 * Resolve whether advance payment applies for a booking.
 * Priority: catalog item → listing bookingConfig → category paymentConfig.
 * Global Settings only supplies the default % when advance is enabled on a service.
 */
const resolveAdvancePaymentConfig = ({
  settings = {},
  category = {},
  listing = {},
  catalogItem = null
} = {}) => {
  const globalDefaultPct = Math.min(
    100,
    Math.max(0, Number(settings.advancePaymentPercent ?? 30))
  );

  const pickPercent = (...candidates) => {
    for (const pct of candidates) {
      const n = Number(pct);
      if (Number.isFinite(n) && n > 0) return Math.min(100, n);
    }
    return globalDefaultPct;
  };

  if (catalogItem) {
    const itemEnabled =
      catalogItem.requireAdvancePayment === true
      || Number(catalogItem.advancePaymentPercent) > 0;
    if (itemEnabled) {
      return {
        requireAdvancePayment: true,
        advancePaymentPercent: pickPercent(
          catalogItem.advancePaymentPercent,
          listing?.bookingConfig?.advancePaymentPercent,
          category?.paymentConfig?.advancePaymentPercent
        ),
        source: 'catalog_item'
      };
    }
  }

  const listingCfg = listing?.bookingConfig || {};
  if (listingCfg.requireAdvancePayment === true || Number(listingCfg.advancePaymentPercent) > 0) {
    return {
      requireAdvancePayment: true,
      advancePaymentPercent: pickPercent(
        listingCfg.advancePaymentPercent,
        category?.paymentConfig?.advancePaymentPercent
      ),
      source: 'listing'
    };
  }

  const catCfg = category?.paymentConfig || {};
  if (catCfg.requireAdvancePayment === true || Number(catCfg.advancePaymentPercent) > 0) {
    return {
      requireAdvancePayment: true,
      advancePaymentPercent: pickPercent(catCfg.advancePaymentPercent),
      source: 'category'
    };
  }

  return {
    requireAdvancePayment: false,
    advancePaymentPercent: 0,
    source: 'none'
  };
};

module.exports = { resolveAdvancePaymentConfig };
