const ServiceListing = require('../../models/ServiceListing');
const Category = require('../../models/Category');
const Vendor = require('../../models/Vendor');
const { logAudit } = require('../../utils/auditLogger');
const cloudinaryService = require('../../services/cloudinaryService');
const { LISTING_STATUS, SERVICE_STATUS, VENDOR_STATUS } = require('../../utils/constants');

/**
 * Get vendor's service listings
 */
const getVendorServices = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;

    const query = { vendorId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const services = await ServiceListing.find(query)
      .populate('categoryId', 'title slug homeIconUrl imageUrl bookingMode defaultPricingModel vendorFormSchema')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceListing.countDocuments(query);

    res.status(200).json({
      success: true,
      data: services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service listings.'
    });
  }
};

/**
 * Get single service listing with full category schema
 * GET /api/vendors/services/:id/detail
 */
const getServiceDetail = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const listing = await ServiceListing.findOne({ _id: id, vendorId })
      .populate('categoryId', 'title slug homeIconUrl imageUrl bookingMode defaultPricingModel vendorFormSchema formSchema supportedBookingTypes requiredDocuments');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    res.status(200).json({
      success: true,
      service: listing,
      categorySchema: listing.categoryId?.vendorFormSchema || []
    });
  } catch (error) {
    console.error('Get service detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service detail.' });
  }
};

/**
 * Create new service listing (or save as draft)
 * POST /api/vendors/services
 */
const createServiceListing = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      categoryId,
      title,
      description,
      shortDescription,
      experience,
      languages,
      bookingMode,
      bookingConfig,
      pricingModel,
      pricing = {},
      availability,
      serviceArea,
      serviceAreaRadiusKm,
      cancellation,
      dynamicFormAnswers = {},
      portfolioPhotos = [],
      portfolioVideos = [],
      documents = [],
      isDraft = false
    } = req.body;

    if (!categoryId || !title) {
      return res.status(400).json({ success: false, message: 'Category ID and service title are required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Selected category does not exist' });
    }

    // Check if vendor already has a listing for this category
    const existing = await ServiceListing.findOne({ vendorId, categoryId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a service listing for this category. Please edit the existing one.' });
    }

    // Process portfolio photos (upload base64 if present)
    const uploadedPhotos = [];
    for (const photo of portfolioPhotos) {
      if (photo && photo.startsWith('data:')) {
        const up = await cloudinaryService.uploadFile(photo, { folder: `vendors/services/${vendorId}` });
        if (up.success) uploadedPhotos.push(up.url);
      } else if (photo) {
        uploadedPhotos.push(photo);
      }
    }

    // Process documents (upload base64 if present)
    const uploadedDocuments = [];
    for (const doc of documents) {
      if (!doc.url) continue;
      let finalUrl = doc.url;
      if (doc.url.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(doc.url, {
          folder: `vendors/service_docs/${vendorId}/${category.slug}`
        });
        if (uploadRes.success) finalUrl = uploadRes.url;
      }
      uploadedDocuments.push({
        label: doc.label || 'Document',
        url: finalUrl,
        type: doc.type || 'other'
      });
    }

    const listing = await ServiceListing.create({
      vendorId,
      categoryId: category._id,
      categoryName: category.title,
      title: title.trim(),
      description: description ? description.trim() : '',
      shortDescription: shortDescription ? shortDescription.trim() : '',
      experience: experience || 0,
      languages: languages || [],
      bookingMode: bookingMode || category.bookingMode || 'BOTH',
      bookingConfig: bookingConfig || {},
      pricingModel: pricingModel || category.defaultPricingModel || 'FIXED',
      pricing,
      availability: availability || {},
      serviceArea: serviceArea || {},
      serviceAreaRadiusKm: serviceAreaRadiusKm || serviceArea?.radiusKm || 10,
      cancellation: cancellation || {},
      dynamicFormAnswers,
      portfolioPhotos: uploadedPhotos,
      portfolioVideos: portfolioVideos || [],
      documents: uploadedDocuments,
      status: isDraft ? LISTING_STATUS.DRAFT : LISTING_STATUS.PENDING_REVIEW,
      submittedAt: isDraft ? null : new Date()
    });

    await logAudit({
      actorId: vendorId,
      actorType: 'VENDOR',
      action: isDraft ? 'SERVICE_DRAFT_SAVED' : 'SERVICE_CREATED',
      entity: 'ServiceListing',
      entityId: listing._id,
      newValue: { title: listing.title, category: category.title, pricing, status: listing.status },
      req
    });

    res.status(201).json({
      success: true,
      message: isDraft ? 'Draft saved successfully. You can continue later.' : 'Service listing created! Sent for admin approval.',
      service: listing
    });
  } catch (error) {
    console.error('Create service listing error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already added a service for this category.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create service listing.' });
  }
};

/**
 * Update service listing (Enforces Pending Edit Review Rule)
 * PATCH /api/vendors/services/:id
 */
const updateServiceListing = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const {
      title, description, shortDescription, experience, languages,
      bookingMode, bookingConfig, pricingModel, pricing,
      availability, serviceArea, serviceAreaRadiusKm, cancellation,
      dynamicFormAnswers, portfolioPhotos, portfolioVideos,
      documents, isDraft
    } = req.body;

    const listing = await ServiceListing.findOne({ _id: id, vendorId });
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    // Process photos if provided
    let uploadedPhotos = listing.portfolioPhotos || [];
    if (portfolioPhotos && Array.isArray(portfolioPhotos)) {
      const newPhotos = [];
      for (const photo of portfolioPhotos) {
        if (photo && photo.startsWith('data:')) {
          const up = await cloudinaryService.uploadFile(photo, { folder: `vendors/services/${vendorId}` });
          if (up.success) newPhotos.push(up.url);
        } else if (photo) {
          newPhotos.push(photo);
        }
      }
      uploadedPhotos = newPhotos;
    }

    // Process documents if provided
    let uploadedDocuments = listing.documents || [];
    if (documents && Array.isArray(documents)) {
      const newDocs = [];
      for (const doc of documents) {
        if (!doc.url) continue;
        let finalUrl = doc.url;
        if (doc.url.startsWith('data:')) {
          const uploadRes = await cloudinaryService.uploadFile(doc.url, {
            folder: `vendors/service_docs/${vendorId}`
          });
          if (uploadRes.success) finalUrl = uploadRes.url;
        }
        newDocs.push({
          label: doc.label || 'Document',
          url: finalUrl,
          type: doc.type || 'other',
          verified: doc.verified || false
        });
      }
      uploadedDocuments = newDocs;
    }

    // Previous values for audit
    const previousValue = {
      title: listing.title,
      pricing: listing.pricing,
      status: listing.status
    };

    // Check if listing is currently approved -> Snapshot approved version for live customers
    if (listing.status === LISTING_STATUS.APPROVED && !isDraft) {
      listing.approvedVersion = {
        title: listing.title,
        description: listing.description,
        shortDescription: listing.shortDescription,
        experience: listing.experience,
        languages: listing.languages,
        pricingModel: listing.pricingModel,
        bookingMode: listing.bookingMode,
        pricing: listing.pricing,
        availability: listing.availability,
        serviceArea: listing.serviceArea,
        cancellation: listing.cancellation,
        dynamicFormAnswers: listing.dynamicFormAnswers,
        portfolioPhotos: listing.portfolioPhotos,
        documents: listing.documents
      };
      listing.hasPendingEdits = true;
      listing.pendingEditSubmittedAt = new Date();
      listing.status = LISTING_STATUS.PENDING_REVIEW;
    }

    // Apply updates
    if (title) listing.title = title.trim();
    if (description !== undefined) listing.description = description.trim();
    if (shortDescription !== undefined) listing.shortDescription = shortDescription.trim();
    if (experience !== undefined) listing.experience = experience;
    if (languages) listing.languages = languages;
    if (bookingMode) listing.bookingMode = bookingMode;
    if (bookingConfig) listing.bookingConfig = { ...listing.bookingConfig, ...bookingConfig };
    if (pricingModel) listing.pricingModel = pricingModel;
    if (pricing) listing.pricing = { ...listing.pricing, ...pricing };
    if (availability) listing.availability = { ...listing.availability, ...availability };
    if (serviceArea) listing.serviceArea = { ...listing.serviceArea, ...serviceArea };
    if (serviceAreaRadiusKm) listing.serviceAreaRadiusKm = serviceAreaRadiusKm;
    if (cancellation) listing.cancellation = { ...listing.cancellation, ...cancellation };
    if (dynamicFormAnswers) listing.dynamicFormAnswers = { ...listing.dynamicFormAnswers, ...dynamicFormAnswers };
    if (portfolioVideos) listing.portfolioVideos = portfolioVideos;
    listing.portfolioPhotos = uploadedPhotos;
    listing.documents = uploadedDocuments;

    // If currently draft and not saving as draft again, submit for review
    if (listing.status === LISTING_STATUS.DRAFT && !isDraft) {
      listing.status = LISTING_STATUS.PENDING_REVIEW;
      listing.submittedAt = new Date();
    }
    // If was changes_requested and vendor resubmits
    if (listing.status === LISTING_STATUS.CHANGES_REQUESTED && !isDraft) {
      listing.status = LISTING_STATUS.PENDING_REVIEW;
      listing.submittedAt = new Date();
      listing.rejectedReason = null;
    }

    await listing.save();

    await logAudit({
      actorId: vendorId,
      actorType: 'VENDOR',
      action: 'SERVICE_UPDATED',
      entity: 'ServiceListing',
      entityId: listing._id,
      previousValue,
      newValue: { title: listing.title, pricing: listing.pricing, status: listing.status },
      req
    });

    res.status(200).json({
      success: true,
      message: listing.hasPendingEdits
        ? 'Changes submitted for review! Currently approved version remains live for customers until approved.'
        : isDraft ? 'Draft saved.' : 'Service listing updated successfully.',
      service: listing
    });
  } catch (error) {
    console.error('Update service listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service listing.' });
  }
};

/**
 * Toggle Service Status (Pause / Resume)
 */
const toggleServiceStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const listing = await ServiceListing.findOne({ _id: id, vendorId });
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    if (listing.status === LISTING_STATUS.APPROVED) {
      listing.status = LISTING_STATUS.PAUSED;
    } else if (listing.status === LISTING_STATUS.PAUSED) {
      listing.status = LISTING_STATUS.APPROVED;
    } else {
      return res.status(400).json({ success: false, message: 'Cannot pause/resume service that is under review or draft.' });
    }

    await listing.save();

    res.status(200).json({
      success: true,
      message: `Service status set to ${listing.status}`,
      service: listing
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update service status' });
  }
};

/**
 * Delete Service Listing
 */
const deleteServiceListing = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const listing = await ServiceListing.findOneAndDelete({ _id: id, vendorId });
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    await logAudit({
      actorId: vendorId,
      actorType: 'VENDOR',
      action: 'SERVICE_DELETED',
      entity: 'ServiceListing',
      entityId: id,
      previousValue: { title: listing.title, category: listing.categoryName },
      req
    });

    res.status(200).json({ success: true, message: 'Service listing deleted' });
  } catch (error) {
    console.error('Delete service listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service listing' });
  }
};

/**
 * Get available categories for vendor enrollment with enrollment status
 * GET /api/vendor/categories
 */
const getAvailableCategories = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findById(vendorId).select('categoryEnrollments service categories approvalStatus');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const categories = await Category.find({ status: SERVICE_STATUS.ACTIVE })
      .select('title slug description homeIconUrl imageUrl supportedBookingTypes allowMultiSelect formSchema vendorFormSchema bookingMode defaultPricingModel requiredDocuments')
      .sort({ homeOrder: 1, title: 1 })
      .lean();

    // Also get existing service listings for this vendor
    const existingListings = await ServiceListing.find({ vendorId })
      .select('categoryId status')
      .lean();
    const listingMap = new Map();
    existingListings.forEach(l => {
      listingMap.set(l.categoryId.toString(), l);
    });

    const enrollmentsMap = new Map();
    (vendor.categoryEnrollments || []).forEach(e => {
      if (e.categoryId) {
        enrollmentsMap.set(e.categoryId.toString(), e);
      }
    });

    const categoryList = categories.map(cat => {
      const enrollment = enrollmentsMap.get(cat._id.toString());
      const existingListing = listingMap.get(cat._id.toString());
      return {
        id: cat._id,
        title: cat.title,
        slug: cat.slug,
        description: cat.description,
        iconUrl: cat.homeIconUrl || cat.imageUrl,
        imageUrl: cat.imageUrl,
        supportedBookingTypes: cat.supportedBookingTypes || ['scheduled'],
        bookingMode: cat.bookingMode || 'BOTH',
        defaultPricingModel: cat.defaultPricingModel || 'FIXED',
        allowMultiSelect: Boolean(cat.allowMultiSelect),
        formSchema: cat.formSchema || [],
        vendorFormSchema: cat.vendorFormSchema || [],
        requiredDocuments: cat.requiredDocuments || [],
        enrollmentStatus: enrollment ? enrollment.status : 'not_applied',
        enrollment: enrollment ? {
          id: enrollment._id,
          status: enrollment.status,
          appliedAt: enrollment.appliedAt,
          approvedAt: enrollment.approvedAt,
          rejectedReason: enrollment.rejectedReason,
          documents: enrollment.documents || [],
          dynamicAnswers: enrollment.dynamicAnswers || {}
        } : null,
        existingListing: existingListing ? {
          id: existingListing._id,
          status: existingListing.status
        } : null
      };
    });

    res.status(200).json({
      success: true,
      accountApprovalStatus: vendor.approvalStatus,
      categories: categoryList
    });
  } catch (error) {
    console.error('Get available categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

/**
 * Apply for category enrollment
 * POST /api/vendor/category-enrollment
 */
const applyCategoryEnrollment = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { categoryId, documents = [], dynamicAnswers = {} } = req.body;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }

    const [vendor, category] = await Promise.all([
      Vendor.findById(vendorId),
      Category.findById(categoryId)
    ]);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Upload any base64 document files to Cloudinary
    const uploadedDocuments = [];
    for (const doc of documents) {
      if (!doc.url) continue;
      let finalUrl = doc.url;
      if (doc.url.startsWith('data:')) {
        const uploadRes = await cloudinaryService.uploadFile(doc.url, {
          folder: `vendors/category_documents/${vendorId}/${category.slug}`
        });
        if (uploadRes.success) {
          finalUrl = uploadRes.url;
        }
      }
      uploadedDocuments.push({
        label: doc.label || 'Document',
        url: finalUrl
      });
    }

    // Check if vendor already has an enrollment entry for this category
    const existingIndex = (vendor.categoryEnrollments || []).findIndex(
      e => e.categoryId && e.categoryId.toString() === categoryId.toString()
    );

    if (existingIndex !== -1) {
      const existingStatus = vendor.categoryEnrollments[existingIndex].status;
      if (existingStatus === VENDOR_STATUS.APPROVED) {
        return res.status(400).json({
          success: false,
          message: 'You are already approved for this category'
        });
      }
      if (existingStatus === VENDOR_STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          message: 'Your application for this category is already pending review'
        });
      }

      // If rejected or suspended, update application and reset to pending
      vendor.categoryEnrollments[existingIndex].status = VENDOR_STATUS.PENDING;
      vendor.categoryEnrollments[existingIndex].documents = uploadedDocuments;
      vendor.categoryEnrollments[existingIndex].dynamicAnswers = dynamicAnswers;
      vendor.categoryEnrollments[existingIndex].appliedAt = new Date();
      vendor.categoryEnrollments[existingIndex].approvedAt = null;
      vendor.categoryEnrollments[existingIndex].rejectedReason = null;
    } else {
      // Create new enrollment entry
      if (!vendor.categoryEnrollments) vendor.categoryEnrollments = [];
      vendor.categoryEnrollments.push({
        categoryId: category._id,
        status: VENDOR_STATUS.PENDING,
        documents: uploadedDocuments,
        dynamicAnswers,
        appliedAt: new Date()
      });
    }

    await vendor.save();

    const updatedEnrollment = vendor.categoryEnrollments.find(e => e.categoryId && e.categoryId.toString() === categoryId.toString());

    res.status(200).json({
      success: true,
      message: `Application for ${category.title} submitted successfully!`,
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Apply category enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit category enrollment application' });
  }
};

/**
 * Get vendor's current category enrollments
 * GET /api/vendor/category-enrollments
 */
const getVendorCategoryEnrollments = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findById(vendorId)
      .populate('categoryEnrollments.categoryId', 'title slug homeIconUrl imageUrl formSchema vendorFormSchema supportedBookingTypes bookingMode defaultPricingModel')
      .select('categoryEnrollments approvalStatus');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.status(200).json({
      success: true,
      accountApprovalStatus: vendor.approvalStatus,
      enrollments: vendor.categoryEnrollments || []
    });
  } catch (error) {
    console.error('Get vendor category enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch category enrollments' });
  }
};

/**
 * Get service preview (compiled full data before submission)
 * GET /api/vendors/services/:id/preview
 */
const getServicePreview = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const listing = await ServiceListing.findOne({ _id: id, vendorId })
      .populate('categoryId', 'title slug homeIconUrl bookingMode defaultPricingModel vendorFormSchema')
      .populate('vendorId', 'name profilePhoto rating totalReviews completedJobs address phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Service listing not found' });
    }

    res.status(200).json({
      success: true,
      preview: {
        service: listing,
        provider: {
          name: listing.vendorId?.name,
          photo: listing.vendorId?.profilePhoto,
          rating: listing.vendorId?.rating,
          reviews: listing.vendorId?.totalReviews,
          completedJobs: listing.vendorId?.completedJobs,
          city: listing.vendorId?.address?.city
        },
        category: {
          title: listing.categoryId?.title,
          icon: listing.categoryId?.homeIconUrl,
          bookingMode: listing.categoryId?.bookingMode
        }
      }
    });
  } catch (error) {
    console.error('Get service preview error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate preview' });
  }
};

module.exports = {
  getVendorServices,
  getServiceDetail,
  createServiceListing,
  updateServiceListing,
  toggleServiceStatus,
  deleteServiceListing,
  getAvailableCategories,
  applyCategoryEnrollment,
  getVendorCategoryEnrollments,
  getServicePreview
};
