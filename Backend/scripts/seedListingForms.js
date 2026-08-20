/**
 * Seed listingForms + commonListingForms for vendor Create Listing wizard.
 *
 * - Common forms → Settings.commonListingForms (apply to ALL categories)
 * - Category forms → Category.listingForms (service-specific steps + menu)
 * - Also syncs vendorFormSchema / catalogItemSchema for legacy fallbacks
 *
 * Usage: node scripts/seedListingForms.js
 * Idempotent — safe to re-run.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const { normalizeListingForm } = require('../utils/listingFormsMerge');

const field = (key, label, type, opts = {}) => ({
  key,
  label,
  type,
  options: opts.options || [],
  required: opts.required === true,
  helpText: opts.helpText || null,
  minValue: opts.minValue ?? null,
  maxValue: opts.maxValue ?? null,
  order: opts.order || 0
});

const form = (id, title, type, fields, order = 0) =>
  normalizeListingForm({
    id,
    key: title,
    title,
    type,
    enabled: true,
    applyToAll: true,
    order,
    fields
  }, order, id);

// ─── COMMON FORMS (all categories) ───
const COMMON_FORMS = [
  form('common_business', 'Business Info', 'fields', [
    field('shopName', 'Business / Shop Name', 'text', { required: true, order: 1 }),
    field('experienceYears', 'Years of Experience', 'number', { required: true, order: 2, minValue: 0 }),
    field('about', 'About Your Service', 'textarea', { required: true, helpText: 'Short intro customers will see', order: 3 }),
    field('languages', 'Languages Spoken', 'text', { helpText: 'e.g. Hindi, English, Marathi', order: 4 }),
    field('serviceCities', 'Cities You Serve', 'text', { helpText: 'e.g. Mumbai, Pune, Thane', order: 5 })
  ], 0),
  form('common_photos', 'Photos & Documents', 'photos', [
    field('idProof', 'ID Proof (Aadhaar / PAN)', 'file', { helpText: 'Optional verification document', order: 1 })
  ], 1)
];

// Menu item schema helpers
const menuPriceFields = [
  field('title', 'Item / Package Name', 'text', { required: true, order: 1 }),
  field('description', 'Description', 'textarea', { order: 2 }),
  field('price', 'Price (₹)', 'number', { required: true, order: 3, minValue: 0 })
];

// ─── PER-CATEGORY LISTING FORMS ───
const CATEGORY_FORMS = {
  // Driver — packages like Day / Night / Outstation
  'driver-booking': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'HOURLY',
    listingForms: [
      form('driver_details', 'Driver Details', 'fields', [
        field('drivingLicense', 'Driving License Number', 'text', { required: true, order: 1 }),
        field('licenseType', 'License Type', 'select', {
          required: true,
          options: ['LMV Commercial', 'LMV Private', 'HMV Heavy Vehicle', 'Transport Vehicle'],
          order: 2
        }),
        field('licenseExpiry', 'License Expiry Date', 'date', { required: true, order: 3 }),
        field('serviceType', 'Service Type', 'multiselect', {
          required: true,
          options: ['Driver Only', 'Driver + Vehicle'],
          order: 4
        }),
        field('vehicleTypes', 'Vehicle Types You Drive', 'multiselect', {
          options: ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'],
          order: 5
        }),
        field('routeTypes', 'Routes Available', 'multiselect', {
          required: true,
          options: ['Local', 'Outstation', 'Airport Transfer', 'Corporate', 'Wedding/Event', 'One-Way', 'Round-Trip'],
          order: 6
        })
      ], 0),
      form('driver_menu', 'Driver Packages', 'menu', [
        ...menuPriceFields,
        field('duration', 'Duration', 'select', {
          options: ['4 Hours', '8 Hours', '12 Hours', 'Full Day', 'Per KM', 'Outstation Night'],
          order: 4
        }),
        field('includes', 'Includes', 'text', { helpText: 'e.g. Fuel, Tolls extra', order: 5 })
      ], 1)
    ]
  },

  'cook-maharaj': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    listingForms: [
      form('cook_details', 'Cook Profile', 'fields', [
        field('cuisineSpecialization', 'Cuisine Specialization', 'multiselect', {
          required: true,
          options: ['North Indian', 'South Indian', 'Gujarati', 'Rajasthani', 'Jain', 'Chinese', 'Continental', 'Mughlai', 'Punjabi', 'Marathi'],
          order: 1
        }),
        field('dietType', 'Diet Preference', 'select', {
          required: true,
          options: ['Pure Veg', 'Veg & Non-Veg', 'Non-Veg Only'],
          order: 2
        }),
        field('serviceType', 'Service Type', 'multiselect', {
          required: true,
          options: ['Daily Cook', 'Part-time Cook', 'Full-time Cook', 'Event / Maharaj', 'Party Cook'],
          order: 3
        }),
        field('meals', 'Meals Prepared', 'multiselect', {
          required: true,
          options: ['Breakfast', 'Lunch', 'Dinner', 'Snacks/Tea'],
          order: 4
        }),
        field('maxPeople', 'Max People Capacity', 'number', { order: 5 })
      ], 0),
      form('cook_menu', 'Packages & Rates', 'menu', [
        ...menuPriceFields,
        field('peopleCount', 'Serves (people)', 'number', { order: 4 }),
        field('mealType', 'Meal Type', 'select', {
          options: ['Breakfast', 'Lunch', 'Dinner', 'Full Day', 'Event'],
          order: 5
        })
      ], 1)
    ]
  },

  'worker-helper': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'DAILY',
    listingForms: [
      form('worker_details', 'Worker Details', 'fields', [
        field('workerSkills', 'Skills & Work Offered', 'multiselect', {
          required: true,
          options: ['Loading / Unloading', 'House Shifting', 'Construction Labour', 'Gardening', 'Packing', 'Cleaning', 'Painting', 'General Helper'],
          order: 1
        }),
        field('workersAvailable', 'Workers Available', 'number', { required: true, order: 2 }),
        field('equipmentProvided', 'Tools / Equipment Provided', 'toggle', { order: 3 }),
        field('vehicleAvailable', 'Transport Vehicle Available', 'toggle', { order: 4 })
      ], 0),
      form('worker_menu', 'Work Packages', 'menu', [
        ...menuPriceFields,
        field('workersNeeded', 'Workers Included', 'number', { order: 4 }),
        field('duration', 'Duration', 'select', {
          options: ['Half Day', 'Full Day', 'Per Hour', 'Per Job'],
          order: 5
        })
      ], 1)
    ]
  },

  'tiffin-service': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    listingForms: [
      form('tiffin_details', 'Kitchen Details', 'fields', [
        field('tiffinServiceName', 'Kitchen / Tiffin Name', 'text', { required: true, order: 1 }),
        field('dietType', 'Food Type', 'multiselect', {
          required: true,
          options: ['Veg', 'Jain', 'Non-Veg', 'Vegan', 'Special Health Meal'],
          order: 2
        }),
        field('meals', 'Meals Available', 'multiselect', {
          required: true,
          options: ['Breakfast', 'Lunch', 'Dinner'],
          order: 3
        }),
        field('subscriptionTypes', 'Subscription Plans', 'multiselect', {
          required: true,
          options: ['Daily Trial', 'Weekly Plan', 'Monthly Plan'],
          order: 4
        }),
        field('deliveryTime', 'Delivery Time Slots', 'text', {
          helpText: 'e.g. 12:00 PM - 1:30 PM',
          order: 5
        }),
        field('fssai', 'FSSAI / Hygiene Note', 'text', { order: 6 }),
        field('pauseAllowed', 'Pause Subscription Allowed', 'toggle', { order: 7 })
      ], 0),
      form('tiffin_menu', 'Tiffin Menu', 'menu', [
        ...menuPriceFields,
        field('mealType', 'Meal', 'select', {
          options: ['Breakfast', 'Lunch', 'Dinner', 'Combo'],
          order: 4
        }),
        field('plan', 'Plan', 'select', {
          options: ['Daily', 'Weekly', 'Monthly'],
          order: 5
        }),
        field('itemsIncluded', 'Items Included', 'text', {
          helpText: 'e.g. 2 roti, sabzi, dal, rice, salad',
          order: 6
        })
      ], 1)
    ]
  },

  'dj-sound': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'HOURLY',
    listingForms: [
      form('dj_details', 'DJ Profile', 'fields', [
        field('djName', 'DJ / Band Name', 'text', { required: true, order: 1 }),
        field('musicGenres', 'Music Genres', 'multiselect', {
          options: ['Bollywood', 'EDM', 'Punjabi', 'Hip-Hop', 'Sufi', 'Classical', 'Party Mix'],
          order: 2
        }),
        field('equipment', 'Equipment Setup', 'multiselect', {
          required: true,
          options: ['DJ Console', 'JBL Sound System', 'Subwoofers', 'LED Lights', 'Laser & Smoke', 'Wireless Mics', 'LED Screen'],
          order: 3
        }),
        field('eventTypes', 'Event Types', 'multiselect', {
          required: true,
          options: ['Wedding', 'Birthday', 'Corporate', 'Party', 'College', 'Religious'],
          order: 4
        }),
        field('portfolioLink', 'Portfolio / YouTube', 'text', { order: 5 })
      ], 0),
      form('dj_menu', 'Packages', 'menu', [
        ...menuPriceFields,
        field('hours', 'Hours Included', 'number', { order: 4 }),
        field('setup', 'Setup Size', 'select', {
          options: ['Small', 'Medium', 'Large', 'Premium'],
          order: 5
        })
      ], 1)
    ]
  },

  'photographer-videographer': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    listingForms: [
      form('photo_details', 'Studio Profile', 'fields', [
        field('photographyStyle', 'Style & Specialization', 'multiselect', {
          options: ['Traditional', 'Candid', 'Cinematic Video', 'Drone Shoot', 'Pre-Wedding', 'Product Shoot', 'Fashion'],
          order: 1
        }),
        field('cameraEquipment', 'Camera & Gear', 'text', {
          helpText: 'e.g. Sony A7IV, Canon R6, DJI Drone',
          order: 2
        }),
        field('teamSize', 'Team Size', 'number', { order: 3 }),
        field('deliverables', 'Deliverables', 'multiselect', {
          options: ['Edited Photos', 'Raw Files', 'Highlight Video', 'Full Reel', 'Drone Footage', 'Photo Album'],
          order: 4
        }),
        field('portfolioLink', 'Portfolio / Instagram', 'text', { order: 5 })
      ], 0),
      form('photo_menu', 'Shoot Packages', 'menu', [
        ...menuPriceFields,
        field('duration', 'Duration', 'select', {
          options: ['2 Hours', '4 Hours', 'Half Day', 'Full Day', 'Multi-Day'],
          order: 4
        }),
        field('includes', 'Includes', 'text', { order: 5 })
      ], 1)
    ]
  },

  'makeup-artist': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'FIXED',
    listingForms: [
      form('makeup_details', 'Artist Profile', 'fields', [
        field('services', 'Services Offered', 'multiselect', {
          required: true,
          options: ['Bridal Makeup', 'Party Makeup', 'Engagement Look', 'HD Airbrush', 'Hair Styling', 'Saree Draping', 'Nail Art'],
          order: 1
        }),
        field('makeupBrands', 'Cosmetic Brands Used', 'text', {
          helpText: 'e.g. MAC, Kryolan, Huda Beauty',
          order: 2
        }),
        field('trialAvailable', 'Trial Session Available', 'toggle', { order: 3 }),
        field('travelAvailable', 'Travel to Client Location', 'toggle', { order: 4 }),
        field('portfolioLink', 'Portfolio / Instagram', 'text', { order: 5 })
      ], 0),
      form('makeup_menu', 'Look Packages', 'menu', [
        ...menuPriceFields,
        field('lookType', 'Look Type', 'select', {
          options: ['Bridal', 'Party', 'Engagement', 'Reception', 'Simple'],
          order: 4
        })
      ], 1)
    ]
  },

  'healthcare-caretaker': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'DAILY',
    listingForms: [
      form('care_details', 'Care Profile', 'fields', [
        field('providerSubType', 'Provider Role', 'select', {
          required: true,
          options: ['GNM/B.Sc Nurse', 'Caretaker / Attendant', 'Elderly Care', 'Post-Surgery Nurse', 'Baby Caretaker', 'Physiotherapist'],
          order: 1
        }),
        field('qualification', 'Qualification / Certificate', 'text', { required: true, order: 2 }),
        field('specialization', 'Specialization', 'multiselect', {
          options: ['Diabetes Care', 'Heart Patient', 'Paralysis/Stroke', 'Alzheimer', 'Cancer Care', 'Pediatric', 'Wound Care'],
          order: 3
        }),
        field('shiftType', 'Shift Options', 'multiselect', {
          required: true,
          options: ['4 Hours', '8 Hours', '12 Hours', '24 Hours Live-in'],
          order: 4
        }),
        field('emergencyAvailable', 'Emergency Available', 'toggle', { order: 5 })
      ], 0),
      form('care_menu', 'Care Packages', 'menu', [
        ...menuPriceFields,
        field('shift', 'Shift', 'select', {
          options: ['4 Hours', '8 Hours', '12 Hours', '24 Hours'],
          order: 4
        })
      ], 1)
    ]
  },

  'room-flat-rental': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    listingForms: [
      form('room_details', 'Property Details', 'fields', [
        field('propertyName', 'Property / Building Name', 'text', { required: true, order: 1 }),
        field('propertyType', 'Property Type', 'select', {
          required: true,
          options: ['Single Room PG', 'Double Sharing PG', 'Furnished AC Room', '1BHK Flat', '2BHK Flat', '3BHK Flat', 'Studio Apartment'],
          order: 2
        }),
        field('furnishing', 'Furnishing', 'select', {
          required: true,
          options: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'],
          order: 3
        }),
        field('amenities', 'Amenities', 'multiselect', {
          options: ['WiFi', 'AC', 'Kitchen', 'Washing Machine', 'Security', 'Power Backup', 'RO Water', 'Parking', 'Lift'],
          order: 4
        }),
        field('genderPreference', 'Gender Preference', 'select', {
          options: ['Male Only', 'Female Only', 'Any', 'Family Only'],
          order: 5
        }),
        field('minRentalDuration', 'Minimum Stay', 'select', {
          options: ['1 Month', '3 Months', '6 Months', '11 Months', '1 Year'],
          order: 6
        })
      ], 0),
      form('room_menu', 'Room / Flat Options', 'menu', [
        ...menuPriceFields,
        field('sharing', 'Sharing', 'select', {
          options: ['Single', 'Double', 'Triple', 'Entire Flat'],
          order: 4
        }),
        field('deposit', 'Security Deposit (₹)', 'number', { order: 5 })
      ], 1)
    ]
  },

  'marriage-hall-venue': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    listingForms: [
      form('hall_details', 'Venue Details', 'fields', [
        field('hallName', 'Hall / Venue Name', 'text', { required: true, order: 1 }),
        field('venueAddress', 'Full Address', 'textarea', { required: true, order: 2 }),
        field('indoorCapacity', 'Indoor Seating Capacity', 'number', { required: true, order: 3 }),
        field('outdoorCapacity', 'Outdoor / Lawn Capacity', 'number', { order: 4 }),
        field('facilities', 'Facilities', 'multiselect', {
          required: true,
          options: ['AC Hall', 'Catering Kitchen', 'Decoration', 'DJ Stage', 'Green Room', 'Bridal Suite', 'Parking', 'Generator'],
          order: 5
        }),
        field('cateringPolicy', 'Catering Policy', 'select', {
          required: true,
          options: ['In-House Only', 'Outside Allowed', 'Both Options'],
          order: 6
        })
      ], 0),
      form('hall_menu', 'Venue Packages', 'menu', [
        ...menuPriceFields,
        field('eventType', 'Best For', 'select', {
          options: ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate'],
          order: 4
        }),
        field('duration', 'Duration', 'select', {
          options: ['Half Day', 'Full Day', 'Evening', 'Night'],
          order: 5
        })
      ], 1)
    ]
  },

  'security-guard': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    listingForms: [
      form('security_details', 'Security Profile', 'fields', [
        field('securityType', 'Security Type', 'multiselect', {
          required: true,
          options: ['Residential Society', 'Commercial / Office', 'Event Security', 'Hospital / School', 'Personal Bodyguard'],
          order: 1
        }),
        field('training', 'Training / Certifications', 'multiselect', {
          options: ['Ex-Serviceman', 'PSARA Licensed', 'Fire Safety', 'First Aid', 'CCTV Monitoring'],
          order: 2
        }),
        field('guardsAvailable', 'Guards Available', 'number', { required: true, order: 3 }),
        field('shiftDuration', 'Shift Duration', 'select', {
          required: true,
          options: ['8 Hours', '12 Hours', '24 Hours'],
          order: 4
        }),
        field('uniformProvided', 'Uniform Provided', 'toggle', { order: 5 })
      ], 0),
      form('security_menu', 'Guard Packages', 'menu', [
        ...menuPriceFields,
        field('guards', 'Guards Included', 'number', { order: 4 }),
        field('shift', 'Shift', 'select', {
          options: ['8 Hours', '12 Hours', '24 Hours'],
          order: 5
        })
      ], 1)
    ]
  },

  'housekeeping-cleaning': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'FIXED',
    listingForms: [
      form('clean_details', 'Cleaning Profile', 'fields', [
        field('cleaningTypes', 'Cleaning Services', 'multiselect', {
          required: true,
          options: ['Full Home Deep Cleaning', 'Kitchen Deep Cleaning', 'Bathroom Scrubbing', 'Sofa & Carpet', 'Move-in/Move-out', 'Floor Polishing', 'Office Cleaning'],
          order: 1
        }),
        field('propertyTypes', 'Property Types', 'multiselect', {
          options: ['1 BHK', '2 BHK', '3 BHK', 'Villa', 'Office', 'Shop'],
          order: 2
        }),
        field('teamSize', 'Team Size', 'number', { required: true, order: 3 }),
        field('materialsIncluded', 'Materials Included', 'toggle', { order: 4 }),
        field('equipmentIncluded', 'Equipment Included', 'toggle', { order: 5 })
      ], 0),
      form('clean_menu', 'Cleaning Packages', 'menu', [
        ...menuPriceFields,
        field('propertySize', 'Property Size', 'select', {
          options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK+', 'Office'],
          order: 4
        })
      ], 1)
    ]
  },

  electrician: {
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    listingForms: [
      form('elec_details', 'Electrician Skills', 'fields', [
        field('services', 'Services Offered', 'multiselect', {
          required: true,
          options: ['Fan Installation', 'Switch & Socket Repair', 'Wiring & Short Circuit', 'MCB Box', 'Inverter Setup', 'Light Fitting', 'Appliance Connection', 'Panel Work'],
          order: 1
        }),
        field('materialsPolicy', 'Materials / Parts', 'select', {
          required: true,
          options: ['Customer Provides', 'Provider Provides', 'Both Options'],
          order: 2
        }),
        field('toolsCarried', 'Tools & Safety Gear', 'text', { order: 3 }),
        field('emergencyAvailable', 'Emergency 24x7 Available', 'toggle', { order: 4 })
      ], 0),
      form('elec_menu', 'Service Rates', 'menu', [
        ...menuPriceFields,
        field('visitType', 'Visit Type', 'select', {
          options: ['Inspection', 'Repair', 'Installation', 'Emergency'],
          order: 4
        })
      ], 1)
    ]
  },

  plumber: {
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    listingForms: [
      form('plumb_details', 'Plumber Skills', 'fields', [
        field('services', 'Services Offered', 'multiselect', {
          required: true,
          options: ['Tap & Mixer Repair', 'Pipe Leakage', 'Toilet Fitting', 'Water Tank', 'Drainage Cleaning', 'Geyser Installation', 'New Piping'],
          order: 1
        }),
        field('materialsPolicy', 'Materials / Parts', 'select', {
          required: true,
          options: ['Customer Provides', 'Provider Provides', 'Both Options'],
          order: 2
        }),
        field('toolsCarried', 'Tools Carried', 'text', { order: 3 }),
        field('emergencyAvailable', 'Emergency Available', 'toggle', { order: 4 })
      ], 0),
      form('plumb_menu', 'Service Rates', 'menu', [
        ...menuPriceFields,
        field('visitType', 'Visit Type', 'select', {
          options: ['Inspection', 'Repair', 'Installation', 'Emergency'],
          order: 4
        })
      ], 1)
    ]
  },

  'ac-appliance-repair': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    listingForms: [
      form('appliance_details', 'Appliance Skills', 'fields', [
        field('applianceTypes', 'Appliances Serviced', 'multiselect', {
          required: true,
          options: ['AC (Split/Window)', 'Refrigerator', 'Washing Machine', 'RO Water Purifier', 'Microwave', 'Geyser', 'Chimney'],
          order: 1
        }),
        field('acServices', 'Services', 'multiselect', {
          options: ['Installation/Uninstallation', 'Gas Filling', 'Repair & PCB', 'Deep Foam Cleaning', 'Filter Replacement', 'AMC'],
          order: 2
        }),
        field('brandsServiced', 'Brands Serviced', 'text', {
          helpText: 'e.g. LG, Samsung, Daikin, Voltas',
          order: 3
        }),
        field('warrantyOffered', 'Service Warranty', 'select', {
          options: ['7 Days', '15 Days', '30 Days', '90 Days'],
          order: 4
        })
      ], 0),
      form('appliance_menu', 'Service Packages', 'menu', [
        ...menuPriceFields,
        field('appliance', 'Appliance', 'select', {
          options: ['AC', 'Refrigerator', 'Washing Machine', 'RO', 'Microwave', 'Geyser'],
          order: 4
        })
      ], 1)
    ]
  },

  'pest-control': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'FIXED',
    listingForms: [
      form('pest_details', 'Pest Control Profile', 'fields', [
        field('pestTypes', 'Pests Treated', 'multiselect', {
          required: true,
          options: ['Cockroaches', 'Termites', 'Mosquitoes', 'Bed Bugs', 'Ants', 'Rodents', 'Lizards'],
          order: 1
        }),
        field('treatmentMethods', 'Treatment Methods', 'multiselect', {
          required: true,
          options: ['Herbal / Organic Gel', 'Chemical Spray', 'Termite Treatment', 'Fumigation', 'Baiting'],
          order: 2
        }),
        field('propertyTypes', 'Property Types', 'multiselect', {
          options: ['Home', 'Office', 'Shop', 'Warehouse', 'Restaurant'],
          order: 3
        }),
        field('warrantyPeriod', 'Warranty', 'select', {
          options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'],
          order: 4
        }),
        field('petSafety', 'Pet-Safe Treatment', 'toggle', { order: 5 })
      ], 0),
      form('pest_menu', 'Treatment Packages', 'menu', [
        ...menuPriceFields,
        field('area', 'Coverage', 'select', {
          options: ['1 BHK', '2 BHK', '3 BHK', 'Office', 'Shop'],
          order: 4
        })
      ], 1)
    ]
  }
};

// Title / slug → schema key
const TITLE_MAP = {
  driver: 'driver-booking',
  'driver booking': 'driver-booking',
  cook: 'cook-maharaj',
  maharaj: 'cook-maharaj',
  'cook / maharaj': 'cook-maharaj',
  'cook maharaj': 'cook-maharaj',
  worker: 'worker-helper',
  helper: 'worker-helper',
  'worker / helper': 'worker-helper',
  tiffin: 'tiffin-service',
  'tiffin service': 'tiffin-service',
  dj: 'dj-sound',
  'dj sound': 'dj-sound',
  photographer: 'photographer-videographer',
  videographer: 'photographer-videographer',
  makeup: 'makeup-artist',
  'makeup artist': 'makeup-artist',
  healthcare: 'healthcare-caretaker',
  nurse: 'healthcare-caretaker',
  caretaker: 'healthcare-caretaker',
  room: 'room-flat-rental',
  rental: 'room-flat-rental',
  'room booking': 'room-flat-rental',
  marriage: 'marriage-hall-venue',
  hall: 'marriage-hall-venue',
  venue: 'marriage-hall-venue',
  security: 'security-guard',
  housekeeping: 'housekeeping-cleaning',
  cleaning: 'housekeeping-cleaning',
  electrician: 'electrician',
  plumber: 'plumber',
  'ac': 'ac-appliance-repair',
  refrigerator: 'ac-appliance-repair',
  appliance: 'ac-appliance-repair',
  washing: 'ac-appliance-repair',
  'pest control': 'pest-control',
  pest: 'pest-control'
};

function findSchemaKey(category) {
  const slug = String(category.slug || '').toLowerCase();
  if (CATEGORY_FORMS[slug]) return slug;

  for (const key of Object.keys(CATEGORY_FORMS)) {
    if (slug.includes(key) || key.includes(slug.replace(/-booking$/, ''))) return key;
  }

  const title = String(category.title || '').toLowerCase().trim();
  if (TITLE_MAP[title]) return TITLE_MAP[title];
  for (const [hint, key] of Object.entries(TITLE_MAP)) {
    if (title.includes(hint)) return key;
  }
  return null;
}

function firstFieldsForm(listingForms = []) {
  return (listingForms || []).find((f) => f.type === 'fields') || null;
}

function firstMenuForm(listingForms = []) {
  return (listingForms || []).find((f) => f.type === 'menu') || null;
}

async function seedListingForms() {
  try {
    await connectDB();
    const Category = require('../models/Category');
    const Settings = require('../models/Settings');

    // 1) Common forms
    let settings = await Settings.findOne({ type: 'global' });
    if (!settings) settings = await Settings.create({ type: 'global' });
    settings.commonListingForms = COMMON_FORMS.map((f, i) => normalizeListingForm(f, i, 'common'));
    settings.markModified('commonListingForms');
    await settings.save();
    console.log(`\n✅ Common forms saved: ${settings.commonListingForms.length}`);
    settings.commonListingForms.forEach((f) => {
      console.log(`   · ${f.title} (${f.type}) — ${(f.fields || []).length} fields`);
    });

    // 2) Per-category forms
    const categories = await Category.find({ status: { $ne: 'deleted' } });
    console.log(`\nFound ${categories.length} categories.\n`);

    let updated = 0;
    let skipped = 0;
    const unmatched = [];

    for (const cat of categories) {
      const key = findSchemaKey(cat);
      if (!key || !CATEGORY_FORMS[key]) {
        console.log(`  ⚠ No template for: "${cat.title}" (${cat.slug})`);
        unmatched.push(cat.title);
        skipped++;
        continue;
      }

      const cfg = CATEGORY_FORMS[key];
      cat.listingForms = cfg.listingForms.map((f, i) => normalizeListingForm(f, i, 'cat'));
      cat.markModified('listingForms');

      const details = firstFieldsForm(cfg.listingForms);
      const menu = firstMenuForm(cfg.listingForms);
      if (details) cat.vendorFormSchema = details.fields || [];
      if (menu) cat.catalogItemSchema = (menu.fields || []).filter((f) => !['title', 'description', 'price'].includes(f.key));

      if (cfg.bookingMode) cat.bookingMode = cfg.bookingMode;
      if (cfg.defaultPricingModel) cat.defaultPricingModel = cfg.defaultPricingModel;

      // Ensure menu section enabled when menu form exists
      if (menu) {
        cat.listingSectionConfig = {
          ...(cat.listingSectionConfig?.toObject?.() || cat.listingSectionConfig || {}),
          profile: { enabled: true, title: details?.title || 'Service Details' },
          menu: { enabled: true, title: menu.title || 'Menu' },
          documents: { enabled: true, title: 'Photos & Documents' }
        };
        cat.markModified('listingSectionConfig');
      }

      await cat.save();
      const formSummary = cat.listingForms.map((f) => `${f.title}[${f.type}]`).join(', ');
      console.log(`  ✅ ${cat.title}`);
      console.log(`     → ${formSummary}`);
      updated++;
    }

    console.log(`\n── Summary ──`);
    console.log(`  Common forms: ${COMMON_FORMS.length}`);
    console.log(`  Categories updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    if (unmatched.length) console.log(`  Unmatched: ${unmatched.join(', ')}`);
    console.log('\nVendor Add Service will now show these steps via /vendors/categories API.\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedListingForms();
