/**
 * Seed Vendor Form Schemas for all 16 ZEVYGO Service Categories
 * 
 * This script populates the `vendorFormSchema` field on each Category document
 * so that the frontend can dynamically render service-specific forms.
 * 
 * Usage: node scripts/seedVendorFormSchemas.js
 * 
 * Idempotent — safe to run multiple times (overwrites vendorFormSchema).
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');

// ──────────────────────────────────────────────────────────────
// HELPER: Creates a field object matching the formFieldSchema
// ──────────────────────────────────────────────────────────────
const field = (key, label, type, options = {}) => ({
  key,
  label,
  type,
  options: options.options || [],
  required: options.required !== undefined ? options.required : false,
  helpText: options.helpText || null,
  order: options.order || 0
});

// ──────────────────────────────────────────────────────────────
// ALL 16 CATEGORY SCHEMAS
// ──────────────────────────────────────────────────────────────

const SCHEMAS = {
  // ─── 1. ELECTRICIAN ───
  'electrician': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('skills', 'Skills & Certifications', 'multiselect', { options: ['Wiring', 'MCB/Fuse', 'Fan Installation', 'Light Installation', 'Switch Repair', 'Inverter/UPS', 'Appliance Connection', 'Electrical Inspection', 'Panel Work', 'Smart Home'], order: 2 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Fan Installation', 'Switch Repair', 'Wiring', 'MCB/Fuse Box', 'Inverter Setup', 'Light Installation', 'Appliance Connection', 'Electrical Inspection', 'Short Circuit Fix', 'Earthing'], order: 3 }),
      field('materialsPolicy', 'Materials / Parts', 'select', { required: true, options: ['Customer Provides', 'Provider Provides', 'Both Options'], order: 4 }),
      field('toolsCarried', 'Tools & Equipment Carried', 'text', { helpText: 'e.g. Multimeter, Drill Machine, Safety Gear', order: 5 }),
      field('emergencyAvailable', 'Emergency Service Available', 'toggle', { order: 6 }),
    ]
  },

  // ─── 2. PLUMBER ───
  'plumber': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Pipe Repair', 'Tap Repair/Replace', 'Toilet Repair', 'Sink Repair', 'Water Tank', 'Leakage Fix', 'Drainage Cleaning', 'New Installation', 'Geyser Installation', 'Water Purifier'], order: 2 }),
      field('skills', 'Specializations', 'multiselect', { options: ['CPVC Piping', 'PPR Piping', 'Concealed Piping', 'Sanitary Work', 'Water Proofing', 'Solar Water Heater'], order: 3 }),
      field('materialsPolicy', 'Materials / Parts', 'select', { required: true, options: ['Customer Provides', 'Provider Provides', 'Both Options'], order: 4 }),
      field('toolsCarried', 'Tools & Equipment Carried', 'text', { order: 5 }),
      field('emergencyAvailable', 'Emergency Service Available', 'toggle', { order: 6 }),
    ]
  },

  // ─── 3. AC & APPLIANCE REPAIR ───
  'ac-appliance-repair': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('applianceTypes', 'Appliance Types Serviced', 'multiselect', { required: true, options: ['AC (Split)', 'AC (Window)', 'Refrigerator', 'Washing Machine (Top Load)', 'Washing Machine (Front Load)', 'RO Water Purifier', 'Microwave', 'Geyser', 'Chimney', 'Dishwasher'], order: 2 }),
      field('acServices', 'AC Services', 'multiselect', { options: ['Installation', 'Uninstallation', 'Gas Filling', 'Repair', 'General Servicing', 'Deep Cleaning', 'PCB Repair', 'Compressor Replace'], order: 3 }),
      field('fridgeServices', 'Refrigerator Services', 'multiselect', { options: ['Repair', 'Gas Filling', 'Compressor', 'Thermostat', 'General Service', 'Door Seal Replace'], order: 4 }),
      field('wmServices', 'Washing Machine Services', 'multiselect', { options: ['Installation', 'Repair', 'Drum Issue', 'Drainage Problem', 'Motor Replace', 'General Service', 'PCB Repair'], order: 5 }),
      field('roServices', 'RO Services', 'multiselect', { options: ['Installation', 'Filter Replacement', 'Repair', 'Servicing', 'AMC', 'Membrane Replace'], order: 6 }),
      field('brandsServiced', 'Brands Serviced', 'text', { helpText: 'e.g. LG, Samsung, Daikin, Voltas, Blue Star, Whirlpool', order: 7 }),
      field('materialsPolicy', 'Parts & Materials', 'select', { required: true, options: ['Customer Provides', 'Provider Provides', 'Both Options'], order: 8 }),
      field('warrantyOffered', 'Warranty on Service', 'select', { options: ['No Warranty', '7 Days', '15 Days', '30 Days', '90 Days'], order: 9 }),
    ]
  },

  // ─── 4. DRIVER BOOKING ───
  'driver-booking': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'HOURLY',
    vendorFormSchema: [
      field('experienceYears', 'Driving Experience (Years)', 'number', { required: true, order: 1 }),
      field('drivingLicense', 'Driving License Number', 'text', { required: true, order: 2 }),
      field('licenseType', 'License Type', 'select', { required: true, options: ['LMV Commercial', 'LMV Private', 'HMV Heavy Vehicle', 'Transport Vehicle'], order: 3 }),
      field('licenseExpiry', 'License Expiry Date', 'date', { required: true, order: 4 }),
      field('serviceType', 'Service Type', 'multiselect', { required: true, options: ['Driver Only', 'Driver + Vehicle'], order: 5 }),
      field('vehicleType', 'Vehicle Type (if providing)', 'select', { options: ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Tempo Traveller', 'Mini Bus', 'Other'], order: 6 }),
      field('vehicleBrand', 'Vehicle Brand', 'text', { order: 7 }),
      field('vehicleModel', 'Vehicle Model', 'text', { order: 8 }),
      field('vehicleRegNumber', 'Vehicle Registration Number', 'text', { order: 9 }),
      field('vehicleYear', 'Vehicle Year', 'number', { order: 10 }),
      field('seatingCapacity', 'Seating Capacity', 'number', { order: 11 }),
      field('acType', 'AC / Non-AC', 'select', { options: ['AC', 'Non-AC'], order: 12 }),
      field('fuelType', 'Fuel Type', 'select', { options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], order: 13 }),
      field('routeTypes', 'Route Types Available', 'multiselect', { required: true, options: ['Local', 'Outstation', 'Airport Transfer', 'Corporate', 'Wedding/Event', 'One-Way', 'Round-Trip'], order: 14 }),
      field('languages', 'Languages Spoken', 'text', { helpText: 'e.g. Hindi, English, Marathi', order: 15 }),
    ]
  },

  // ─── 5. PHOTOGRAPHER & VIDEOGRAPHER ───
  'photographer-videographer': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('photographyStyle', 'Photography Style', 'multiselect', { options: ['Traditional', 'Candid', 'Cinematic', 'Documentary', 'Fine Art', 'Lifestyle', 'Drone'], order: 2 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Photography', 'Videography', 'Drone', 'Wedding', 'Pre-Wedding', 'Birthday', 'Corporate', 'Product Photography', 'Maternity', 'Fashion', 'Food Photography'], order: 3 }),
      field('cameraEquipment', 'Camera Equipment', 'text', { helpText: 'e.g. Sony A7IV, Canon R6, DJI Mavic 3', order: 4 }),
      field('teamSize', 'Team Size', 'number', { helpText: 'Number of photographers/videographers', order: 5 }),
      field('packages', 'Packages Offered', 'multiselect', { options: ['Basic', 'Standard', 'Premium', 'Custom'], order: 6 }),
      field('deliverables', 'Deliverables', 'multiselect', { options: ['Edited Photos', 'Raw Photos', 'Highlight Video', 'Full Length Video', 'Drone Footage', 'Photo Album', 'Canvas Prints', 'Social Media Edits'], order: 7 }),
      field('editedPhotoCount', 'Edited Photos Per Event', 'number', { helpText: 'Approximate count', order: 8 }),
      field('deliveryDays', 'Delivery Time (Days)', 'number', { helpText: 'Days after event to deliver', order: 9 }),
      field('portfolioLink', 'Portfolio / Instagram Link', 'text', { order: 10 }),
    ]
  },

  // ─── 6. HOUSEKEEPING & CLEANING ───
  'housekeeping-cleaning': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'FIXED',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('cleaningTypes', 'Cleaning Types', 'multiselect', { required: true, options: ['Full Home Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'Deep Cleaning', 'Regular Cleaning', 'Move-in/Move-out', 'Window Cleaning', 'Floor Scrubbing'], order: 2 }),
      field('propertyTypes', 'Property Types Served', 'multiselect', { options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa', 'Office', 'Commercial', 'Other'], order: 3 }),
      field('teamSize', 'Number of Workers', 'number', { required: true, order: 4 }),
      field('equipmentIncluded', 'Equipment Included', 'toggle', { helpText: 'Do you bring cleaning equipment?', order: 5 }),
      field('materialsIncluded', 'Cleaning Materials Included', 'toggle', { helpText: 'Do you bring cleaning chemicals/materials?', order: 6 }),
    ]
  },

  // ─── 7. COOK / MAHARAJ ───
  'cook-maharaj': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('cuisineSpecialization', 'Cuisine Specialization', 'multiselect', { required: true, options: ['North Indian', 'South Indian', 'Gujarati', 'Rajasthani', 'Jain', 'Chinese', 'Continental', 'Bakery', 'Mughlai', 'Bengali', 'Marathi', 'Punjabi', 'Other'], order: 2 }),
      field('dietType', 'Diet Preference', 'select', { required: true, options: ['Pure Veg', 'Veg & Non-Veg', 'Non-Veg Only'], order: 3 }),
      field('serviceType', 'Service Type', 'multiselect', { required: true, options: ['Daily Cook', 'Part-time Cook', 'Full-time Cook', 'Event/Party', 'One-time'], order: 4 }),
      field('meals', 'Meals Prepared', 'multiselect', { required: true, options: ['Breakfast', 'Lunch', 'Dinner', 'Snacks/Tea'], order: 5 }),
      field('maxPeople', 'Maximum People Can Cook For', 'number', { order: 6 }),
      field('mealsPerDay', 'Meals Per Day', 'number', { order: 7 }),
      field('previousExperience', 'Previous Work Experience', 'textarea', { helpText: 'Hotels, restaurants, or families worked for', order: 8 }),
      field('languages', 'Languages Spoken', 'text', { order: 9 }),
    ]
  },

  // ─── 8. TIFFIN SERVICE ───
  'tiffin-service': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    vendorFormSchema: [
      field('tiffinServiceName', 'Tiffin Service / Kitchen Name', 'text', { required: true, order: 1 }),
      field('dietType', 'Food Type', 'multiselect', { required: true, options: ['Veg', 'Jain', 'Non-Veg', 'Vegan', 'Special Diet'], order: 2 }),
      field('meals', 'Meals Available', 'multiselect', { required: true, options: ['Breakfast', 'Lunch', 'Dinner'], order: 3 }),
      field('subscriptionTypes', 'Subscription Types', 'multiselect', { required: true, options: ['Daily', 'Weekly', 'Monthly'], order: 4 }),
      field('mealsPerDay', 'Meals Per Day', 'number', { order: 5 }),
      field('deliveryDays', 'Delivery Days', 'multiselect', { options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], order: 6 }),
      field('deliveryTime', 'Delivery Time Slots', 'text', { helpText: 'e.g. 12:00 PM - 1:30 PM', order: 7 }),
      field('pauseAllowed', 'Subscription Pause Allowed', 'toggle', { order: 8 }),
      field('maxDailyOrders', 'Max Daily Orders Capacity', 'number', { order: 9 }),
      field('hygieneDetails', 'Hygiene & Certifications', 'textarea', { helpText: 'FSSAI, Kitchen hygiene details', order: 10 }),
    ]
  },

  // ─── 9. ROOM & FLAT RENTAL ───
  'room-flat-rental': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    vendorFormSchema: [
      field('propertyName', 'Property / Building Name', 'text', { required: true, order: 1 }),
      field('propertyType', 'Property Type', 'select', { required: true, options: ['Single Room PG', 'Double Sharing PG', 'Furnished AC Room', '1BHK Flat', '2BHK Flat', '3BHK Flat', 'Independent House', 'Studio Apartment', 'Commercial Space'], order: 2 }),
      field('totalRooms', 'Total Rooms', 'number', { order: 3 }),
      field('availableRooms', 'Available Rooms', 'number', { required: true, order: 4 }),
      field('furnishing', 'Furnishing', 'select', { required: true, options: ['Furnished', 'Semi-Furnished', 'Unfurnished'], order: 5 }),
      field('acType', 'AC / Non-AC', 'select', { options: ['AC', 'Non-AC', 'Both Available'], order: 6 }),
      field('attachedBathroom', 'Attached Bathroom', 'toggle', { order: 7 }),
      field('balcony', 'Balcony Available', 'toggle', { order: 8 }),
      field('amenities', 'Amenities', 'multiselect', { options: ['WiFi', 'Parking', 'Kitchen', 'Washing Machine', 'Security', 'Power Backup', 'RO Water', 'CCTV', 'Lift', 'Garden', 'Gym', 'Swimming Pool'], order: 9 }),
      field('rules', 'House Rules', 'multiselect', { options: ['No Smoking', 'No Pets', 'No Guests', 'Vegetarian Only', 'No Alcohol', 'Gate Closing Time'], order: 10 }),
      field('minRentalDuration', 'Minimum Rental Duration', 'select', { options: ['1 Month', '3 Months', '6 Months', '11 Months', '1 Year'], order: 11 }),
      field('genderPreference', 'Gender Preference', 'select', { options: ['Male Only', 'Female Only', 'Any', 'Family Only'], order: 12 }),
      field('electricityCharges', 'Electricity Charges', 'select', { options: ['Included', 'Separate (Meter)', 'Fixed Amount'], order: 13 }),
    ]
  },

  // ─── 10. HEALTHCARE & CARETAKER ───
  'healthcare-caretaker': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('providerSubType', 'Provider Type', 'select', { required: true, options: ['Home Nurse', 'Caretaker', 'Patient Attendant', 'Elderly Care', 'Post-Surgery Care', 'Baby Care', 'Physiotherapist'], order: 1 }),
      field('qualification', 'Qualification / Certification', 'text', { required: true, helpText: 'e.g. GNM Nurse, B.Sc Nursing, ANM', order: 2 }),
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 3 }),
      field('specialization', 'Specialization', 'multiselect', { options: ['Diabetes Care', 'Heart Patient', 'Paralysis/Stroke', 'Alzheimer', 'Cancer Care', 'Pediatric', 'ICU Trained', 'Wound Care', 'IV/Injection'], order: 4 }),
      field('patientGender', 'Comfortable with Patient Gender', 'select', { options: ['Male Only', 'Female Only', 'Any'], order: 5 }),
      field('shiftType', 'Available Shifts', 'multiselect', { required: true, options: ['4 Hours', '8 Hours', '12 Hours', '24 Hours Live-in', 'Custom'], order: 6 }),
      field('emergencyAvailable', 'Emergency Availability', 'toggle', { order: 7 }),
      field('languages', 'Languages Spoken', 'text', { order: 8 }),
      field('medicalEquipment', 'Medical Equipment Carried', 'text', { helpText: 'e.g. BP Monitor, Glucometer, Wheelchair', order: 9 }),
    ]
  },

  // ─── 11. SECURITY GUARD ───
  'security-guard': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('guardAge', 'Age', 'number', { order: 2 }),
      field('guardGender', 'Gender', 'select', { options: ['Male', 'Female'], order: 3 }),
      field('securityType', 'Security Type', 'multiselect', { required: true, options: ['Residential', 'Commercial', 'Event', 'Hospital', 'School', 'Industrial', 'Society', 'VIP/Personal'], order: 4 }),
      field('training', 'Training / Certifications', 'multiselect', { options: ['Ex-Serviceman', 'PSARA Licensed', 'Fire Safety Trained', 'First Aid Certified', 'CCTV Monitoring', 'Self Defense'], order: 5 }),
      field('guardsAvailable', 'Number of Guards Available', 'number', { required: true, order: 6 }),
      field('shiftDuration', 'Shift Duration', 'select', { required: true, options: ['8 Hours', '12 Hours', '24 Hours'], order: 7 }),
      field('uniformProvided', 'Uniform Provided', 'toggle', { order: 8 }),
      field('languages', 'Languages Spoken', 'text', { order: 9 }),
    ]
  },

  // ─── 12. PEST CONTROL ───
  'pest-control': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'FIXED',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('propertyTypes', 'Property Types Served', 'multiselect', { required: true, options: ['Home', 'Office', 'Shop', 'Warehouse', 'Restaurant', 'Factory', 'Hotel', 'Hospital'], order: 2 }),
      field('pestTypes', 'Pest Types Treated', 'multiselect', { required: true, options: ['Cockroach', 'Termite', 'Mosquito', 'Bed Bugs', 'Ants', 'Rodents', 'Lizards', 'Flies', 'Wood Borer', 'Other'], order: 3 }),
      field('treatmentMethods', 'Treatment Methods', 'multiselect', { required: true, options: ['Chemical Spray', 'Gel Treatment', 'Herbal/Organic', 'Termite Treatment', 'Fumigation', 'Baiting', 'Heat Treatment'], order: 4 }),
      field('propertySizeRange', 'Property Size Range', 'text', { helpText: 'e.g. 500 - 5000 sq ft', order: 5 }),
      field('treatmentDuration', 'Typical Treatment Duration', 'text', { helpText: 'e.g. 1-2 hours', order: 6 }),
      field('reentryTime', 'Re-entry Time After Treatment', 'text', { helpText: 'e.g. 2-4 hours', order: 7 }),
      field('warrantyPeriod', 'Warranty Period', 'select', { options: ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year'], order: 8 }),
      field('petSafety', 'Pet-Safe Treatment Available', 'toggle', { order: 9 }),
      field('childSafety', 'Child-Safe Treatment Available', 'toggle', { order: 10 }),
    ]
  },

  // ─── 13. WORKER / HELPER ───
  'worker-helper': {
    bookingMode: 'BOTH',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('workerSkills', 'Skills', 'multiselect', { required: true, options: ['Loading', 'Unloading', 'Shifting', 'Construction', 'Gardening', 'Packing', 'Cleaning', 'Painting', 'Carpentry', 'General Helper'], order: 2 }),
      field('workerGender', 'Gender', 'select', { options: ['Male', 'Female', 'Any'], order: 3 }),
      field('workerAge', 'Age Range', 'text', { helpText: 'e.g. 20-45', order: 4 }),
      field('workersAvailable', 'Number of Workers Available', 'number', { required: true, order: 5 }),
      field('minWorkers', 'Minimum Workers Per Job', 'number', { order: 6 }),
      field('equipmentProvided', 'Equipment Provided', 'toggle', { helpText: 'Do you provide required tools/equipment?', order: 7 }),
      field('vehicleAvailable', 'Transport Vehicle Available', 'toggle', { helpText: 'For shifting/transport jobs', order: 8 }),
      field('languages', 'Languages Spoken', 'text', { order: 9 }),
    ]
  },

  // ─── 14. DJ SOUND & LIGHTS ───
  'dj-sound': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'HOURLY',
    vendorFormSchema: [
      field('djName', 'DJ / Company Name', 'text', { required: true, order: 1 }),
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 2 }),
      field('musicGenres', 'Music Genres', 'multiselect', { options: ['Bollywood', 'EDM', 'Hip-Hop', 'Punjabi', 'Classical', 'Sufi', 'Rock', 'Pop', 'Regional', 'International'], order: 3 }),
      field('eventTypes', 'Event Types', 'multiselect', { required: true, options: ['Wedding', 'Birthday', 'Corporate', 'Party', 'Religious', 'College', 'New Year', 'Anniversary', 'Pool Party', 'Other'], order: 4 }),
      field('equipment', 'Equipment Available', 'multiselect', { required: true, options: ['Speakers (Small)', 'Speakers (Large)', 'Subwoofers', 'LED Lights', 'Laser Lights', 'LED Screen', 'DJ Console', 'Smoke Machine', 'Confetti Machine', 'Generator', 'Mic/Wireless Mic'], order: 5 }),
      field('minHours', 'Minimum Hours Per Event', 'number', { order: 6 }),
      field('setupTime', 'Setup Time Required (Hours)', 'number', { order: 7 }),
      field('maxGuestCapacity', 'Max Guest Capacity', 'number', { helpText: 'Maximum crowd your setup can handle', order: 8 }),
      field('travelIncluded', 'Travel Charges', 'select', { options: ['Included', 'Extra (Per KM)', 'Fixed Extra Charge'], order: 9 }),
      field('portfolioLink', 'Portfolio / YouTube Link', 'text', { order: 10 }),
    ]
  },

  // ─── 15. MAKEUP ARTIST ───
  'makeup-artist': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'FIXED',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('certification', 'Certifications', 'text', { helpText: 'e.g. Lakme Academy, VLCC, Self-taught', order: 2 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Bridal Makeup', 'Groom Makeup', 'Party Makeup', 'Engagement Look', 'Reception Look', 'HD Makeup', 'Airbrush Makeup', 'Hair Styling', 'Saree Draping', 'Nail Art', 'Eyelash Extensions', 'Mehendi'], order: 3 }),
      field('makeupBrands', 'Brands Used', 'text', { helpText: 'e.g. MAC, Bobbi Brown, Kryolan, Huda Beauty', order: 4 }),
      field('trialAvailable', 'Trial Session Available', 'toggle', { order: 5 }),
      field('teamSize', 'Team Size', 'number', { helpText: 'Number of makeup artists in your team', order: 6 }),
      field('travelAvailable', 'Travel to Client Location', 'toggle', { order: 7 }),
      field('portfolioLink', 'Portfolio / Instagram Link', 'text', { order: 8 }),
    ]
  },

  // ─── 16. MARRIAGE HALL & VENUE ───
  'marriage-hall-venue': {
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('hallName', 'Hall / Venue Name', 'text', { required: true, order: 1 }),
      field('venueAddress', 'Full Venue Address', 'textarea', { required: true, order: 2 }),
      field('indoorCapacity', 'Indoor Seating Capacity', 'number', { required: true, order: 3 }),
      field('outdoorCapacity', 'Outdoor / Lawn Capacity', 'number', { order: 4 }),
      field('parkingCapacity', 'Parking Capacity (Vehicles)', 'number', { order: 5 }),
      field('eventTypes', 'Event Types Hosted', 'multiselect', { required: true, options: ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Corporate', 'Exhibition', 'Religious', 'Anniversary', 'Other'], order: 6 }),
      field('facilities', 'Facilities Available', 'multiselect', { required: true, options: ['AC Hall', 'Non-AC Hall', 'Catering Kitchen', 'In-House Catering', 'Decoration', 'Stage', 'DJ Area', 'Green Room', 'Bridal Room', 'Guest Rooms', 'Parking', 'Generator', 'Valet Parking', 'CCTV'], order: 7 }),
      field('cateringPolicy', 'Catering Policy', 'select', { required: true, options: ['In-House Only', 'Outside Allowed', 'Both Options'], order: 8 }),
      field('decorationIncluded', 'Basic Decoration Included', 'toggle', { order: 9 }),
      field('alcoholPolicy', 'Alcohol Policy', 'select', { options: ['Not Allowed', 'Allowed', 'Licensed Bar Available'], order: 10 }),
      field('musicPolicy', 'Music / DJ Policy', 'select', { options: ['In-House DJ', 'Outside DJ Allowed', 'Both', 'Music Restricted After 10 PM'], order: 11 }),
    ]
  }
};

// ──────────────────────────────────────────────────────────────
// SLUG MAPPING: Maps category slugs to schema keys
// Also supports title-based matching as fallback
// ──────────────────────────────────────────────────────────────
const TITLE_TO_SCHEMA_KEY = {
  'electrician': 'electrician',
  'plumber': 'plumber',
  'ac & appliance repair': 'ac-appliance-repair',
  'ac/refrigerator/washing machine/ro': 'ac-appliance-repair',
  'ac refrigerator washing machine ro': 'ac-appliance-repair',
  'ac': 'ac-appliance-repair',
  'washing machine': 'ac-appliance-repair',
  'cooler': 'ac-appliance-repair',
  'ro-prufier': 'ac-appliance-repair',
  'r.o. prufier': 'ac-appliance-repair',
  'geyser': 'ac-appliance-repair',
  'microwave': 'ac-appliance-repair',
  'led': 'ac-appliance-repair',
  'fridge': 'ac-appliance-repair',
  'kitchen chimney': 'ac-appliance-repair',
  'kitchen-chimney': 'ac-appliance-repair',
  'dish washer': 'ac-appliance-repair',
  'dish-washer': 'ac-appliance-repair',
  'appliance service': 'ac-appliance-repair',
  'appliance-service': 'ac-appliance-repair',
  'driver booking': 'driver-booking',
  'driver': 'driver-booking',
  'photographer & videographer': 'photographer-videographer',
  'photographer videographer': 'photographer-videographer',
  'housekeeping & cleaning': 'housekeeping-cleaning',
  'housekeeping & home cleaning': 'housekeeping-cleaning',
  'housekeeping cleaning': 'housekeeping-cleaning',
  'housekeeping': 'housekeeping-cleaning',
  'cook / maharaj': 'cook-maharaj',
  'cook maharaj': 'cook-maharaj',
  'cook/maharaj': 'cook-maharaj',
  'tiffin service': 'tiffin-service',
  'room & flat rental': 'room-flat-rental',
  'room rental': 'room-flat-rental',
  'room-rental': 'room-flat-rental',
  'room booking': 'room-flat-rental',
  'room flat rental': 'room-flat-rental',
  'healthcare & caretaker': 'healthcare-caretaker',
  'healthcare & nursing': 'healthcare-caretaker',
  'healthcare': 'healthcare-caretaker',
  'security guard': 'security-guard',
  'atm, e-surveillance, recycler': 'security-guard',
  'atm-e-surveillance-recycler': 'security-guard',
  'pest control': 'pest-control',
  'worker / helper': 'worker-helper',
  'worker/helper': 'worker-helper',
  'worker helper': 'worker-helper',
  'dj sound & lights': 'dj-sound',
  'dj & sound system': 'dj-sound',
  'dj booking': 'dj-sound',
  'dj-booking': 'dj-sound',
  'dj sound': 'dj-sound',
  'makeup artist': 'makeup-artist',
  'marriage hall & venue': 'marriage-hall-venue',
  'marriage hall': 'marriage-hall-venue',
};

function findSchemaKey(category) {
  // 1. Try exact slug match
  if (SCHEMAS[category.slug]) return category.slug;

  // 2. Try title-based match (lowercase)
  const titleLower = category.title.toLowerCase().trim();
  if (TITLE_TO_SCHEMA_KEY[titleLower]) return TITLE_TO_SCHEMA_KEY[titleLower];

  // 3. Try partial title match
  for (const [key, schemaKey] of Object.entries(TITLE_TO_SCHEMA_KEY)) {
    if (titleLower.includes(key) || key.includes(titleLower)) {
      return schemaKey;
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ──────────────────────────────────────────────────────────────
async function seedVendorFormSchemas() {
  try {
    await connectDB();
    const Category = require('../models/Category');

    const categories = await Category.find({});
    console.log(`\nFound ${categories.length} categories in database.\n`);

    let updated = 0;
    let skipped = 0;
    const notMatched = [];

    for (const cat of categories) {
      const schemaKey = findSchemaKey(cat);

      if (!schemaKey || !SCHEMAS[schemaKey]) {
        console.log(`  ⚠ No schema found for: "${cat.title}" (slug: ${cat.slug})`);
        notMatched.push(cat.title);
        skipped++;
        continue;
      }

      const schema = SCHEMAS[schemaKey];

      cat.vendorFormSchema = schema.vendorFormSchema;
      if (schema.bookingMode) cat.bookingMode = schema.bookingMode;
      if (schema.defaultPricingModel) cat.defaultPricingModel = schema.defaultPricingModel;

      await cat.save();
      console.log(`  ✅ Updated: "${cat.title}" → ${schema.vendorFormSchema.length} fields`);
      updated++;
    }

    console.log(`\n── Summary ──`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    if (notMatched.length > 0) {
      console.log(`  Not matched: ${notMatched.join(', ')}`);
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedVendorFormSchemas();
