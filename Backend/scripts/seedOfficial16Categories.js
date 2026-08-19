/**
 * Seed Official 16 ZEVYGO Categories with HD Unsplash Images & Full Vendor Form Schemas
 * 
 * Usage: node scripts/seedOfficial16Categories.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');

const field = (key, label, type, options = {}) => ({
  key,
  label,
  type,
  options: options.options || [],
  required: options.required !== undefined ? options.required : false,
  helpText: options.helpText || null,
  order: options.order || 0
});

const OFFICIAL_16_CATEGORIES = [
  {
    title: 'Driver Booking',
    slug: 'driver-booking',
    homeBadge: 'Instant & Outstation',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 1,
    bookingMode: 'BOTH',
    defaultPricingModel: 'HOURLY',
    vendorFormSchema: [
      field('drivingLicense', 'Driving License Number', 'text', { required: true, order: 1 }),
      field('licenseType', 'License Type', 'select', { required: true, options: ['LMV Commercial', 'LMV Private', 'HMV Heavy Vehicle', 'Transport Vehicle'], order: 2 }),
      field('experienceYears', 'Driving Experience (Years)', 'number', { required: true, order: 3 }),
      field('serviceType', 'Service Type Offered', 'multiselect', { required: true, options: ['Driver Only', 'Driver + Vehicle'], order: 4 }),
      field('vehicleTypes', 'Driveable Vehicle Types', 'multiselect', { options: ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Tempo Traveller', 'Mini Bus'], order: 5 }),
      field('routeTypes', 'Route Availability', 'multiselect', { required: true, options: ['Local', 'Outstation', 'Airport Transfer', 'Corporate', 'One-Way', 'Round-Trip'], order: 6 }),
      field('languages', 'Languages Spoken', 'text', { helpText: 'e.g. Hindi, English, Marathi', order: 7 }),
    ]
  },
  {
    title: 'Cook / Maharaj Booking',
    slug: 'cook-maharaj-booking',
    homeBadge: 'Popular & Daily',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 2,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('cuisineSpecialization', 'Cuisine Specialization', 'multiselect', { required: true, options: ['North Indian', 'South Indian', 'Gujarati', 'Rajasthani', 'Jain', 'Chinese', 'Continental', 'Mughlai', 'Punjabi'], order: 1 }),
      field('dietType', 'Diet Preference', 'select', { required: true, options: ['Pure Veg', 'Veg & Non-Veg', 'Non-Veg Only'], order: 2 }),
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 3 }),
      field('serviceType', 'Service Type', 'multiselect', { required: true, options: ['Daily Cook', 'Part-time Cook', 'Full-time Cook', 'Event / Maharaj', 'Party Cook'], order: 4 }),
      field('meals', 'Meals Prepared', 'multiselect', { required: true, options: ['Breakfast', 'Lunch', 'Dinner', 'Snacks/Tea'], order: 5 }),
      field('maxPeople', 'Max People Capacity', 'number', { helpText: 'Maximum people you can cook for', order: 6 }),
    ]
  },
  {
    title: 'Worker / Helper Booking',
    slug: 'worker-helper-booking',
    homeBadge: 'Labour & Shifting',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 3,
    bookingMode: 'BOTH',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('workerSkills', 'Skills & Work Offered', 'multiselect', { required: true, options: ['Loading / Unloading', 'House Shifting', 'Construction Labour', 'Gardening', 'Packing', 'Cleaning', 'General Helper'], order: 2 }),
      field('workersAvailable', 'Number of Workers Available', 'number', { required: true, order: 3 }),
      field('equipmentProvided', 'Tools / Equipment Provided', 'toggle', { helpText: 'Do you bring required tools?', order: 4 }),
      field('vehicleAvailable', 'Transport Vehicle Available', 'toggle', { helpText: 'Vehicle for goods loading', order: 5 }),
    ]
  },
  {
    title: 'Tiffin Service Booking',
    slug: 'tiffin-service-booking',
    homeBadge: 'Subscription',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 4,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    vendorFormSchema: [
      field('tiffinServiceName', 'Kitchen / Tiffin Name', 'text', { required: true, order: 1 }),
      field('dietType', 'Food Type', 'multiselect', { required: true, options: ['Veg', 'Jain', 'Non-Veg', 'Vegan', 'Special Health Meal'], order: 2 }),
      field('meals', 'Meals Available', 'multiselect', { required: true, options: ['Breakfast', 'Lunch', 'Dinner'], order: 3 }),
      field('subscriptionTypes', 'Subscription Plans', 'multiselect', { required: true, options: ['Daily Trial', 'Weekly Plan', 'Monthly Plan'], order: 4 }),
      field('deliveryTime', 'Delivery Time Slots', 'text', { helpText: 'e.g. 12:00 PM - 1:30 PM', order: 5 }),
      field('pauseAllowed', 'Pause Subscription Allowed', 'toggle', { order: 6 }),
    ]
  },
  {
    title: 'DJ Sound Booking',
    slug: 'dj-sound-booking',
    homeBadge: 'Party & Wedding',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 5,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'HOURLY',
    vendorFormSchema: [
      field('djName', 'DJ / Band Name', 'text', { required: true, order: 1 }),
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 2 }),
      field('musicGenres', 'Music Genres Played', 'multiselect', { options: ['Bollywood', 'EDM', 'Punjabi', 'Hip-Hop', 'Sufi', 'Classical', 'Party Mix'], order: 3 }),
      field('equipment', 'Equipment Setup', 'multiselect', { required: true, options: ['Dual DJ Console', 'JBL Sound System', 'Subwoofers', 'LED Moving Lights', 'Laser & Smoke Machine', 'Wireless Mics'], order: 4 }),
      field('minHours', 'Minimum Hours Per Event', 'number', { order: 5 }),
      field('portfolioLink', 'Portfolio / YouTube Link', 'text', { order: 6 }),
    ]
  },
  {
    title: 'Photographer & Videographer Booking',
    slug: 'photographer-videographer-booking',
    homeBadge: 'Event & Shoot',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 6,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('photographyStyle', 'Style & Specialization', 'multiselect', { options: ['Traditional', 'Candid', 'Cinematic Video', 'Drone Shoot', 'Pre-Wedding', 'Product Shoot', 'Fashion Shoot'], order: 2 }),
      field('cameraEquipment', 'Camera & Gear List', 'text', { helpText: 'e.g. Sony A7IV, Canon R6, DJI Drone', order: 3 }),
      field('teamSize', 'Team Size', 'number', { order: 4 }),
      field('deliverables', 'Deliverables Included', 'multiselect', { options: ['Edited Photos', 'Raw Files', 'Highlight Teaser Video', 'Full Reel', 'Drone Footage', 'Printed Photo Album'], order: 5 }),
      field('portfolioLink', 'Portfolio / Instagram Link', 'text', { order: 6 }),
    ]
  },
  {
    title: 'Makeup Artist Booking',
    slug: 'makeup-artist-booking',
    homeBadge: 'Bridal & Party',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 7,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'FIXED',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Bridal Makeup', 'Party Makeup', 'Engagement Look', 'HD Airbrush', 'Hair Styling', 'Saree Draping', 'Nail Art'], order: 2 }),
      field('makeupBrands', 'Cosmetic Brands Used', 'text', { helpText: 'e.g. MAC, Kryolan, Huda Beauty, Bobbi Brown', order: 3 }),
      field('trialAvailable', 'Paid Trial Available', 'toggle', { order: 4 }),
      field('travelAvailable', 'Travel to Venue / Home', 'toggle', { order: 5 }),
      field('portfolioLink', 'Portfolio / Instagram Link', 'text', { order: 6 }),
    ]
  },
  {
    title: 'Healthcare Service (Home Nurse / Caretaker / Patient Attendant)',
    slug: 'healthcare-service-booking',
    homeBadge: 'Patient & Elderly Care',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 8,
    bookingMode: 'BOTH',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('providerSubType', 'Provider Role', 'select', { required: true, options: ['GNM/B.Sc Nurse', 'Caretaker / Attendant', 'Elderly Care', 'Post-Surgery Nurse', 'Baby Caretaker', 'Physiotherapist'], order: 1 }),
      field('qualification', 'Qualifications / Certificate', 'text', { required: true, order: 2 }),
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 3 }),
      field('shiftType', 'Shift Options', 'multiselect', { required: true, options: ['8 Hours', '12 Hours', '24 Hours Live-in'], order: 4 }),
      field('emergencyAvailable', 'Emergency Available', 'toggle', { order: 5 }),
    ]
  },
  {
    title: 'Room Booking (Monthly & Yearly Rental)',
    slug: 'room-booking-rental',
    homeBadge: 'Monthly Rent',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 9,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    vendorFormSchema: [
      field('propertyName', 'Property / Building Name', 'text', { required: true, order: 1 }),
      field('propertyType', 'Property Type', 'select', { required: true, options: ['Single Room PG', 'Double Sharing PG', 'Furnished AC Room', '1BHK Flat', '2BHK Flat', 'Studio Apartment'], order: 2 }),
      field('furnishing', 'Furnishing Status', 'select', { required: true, options: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'], order: 3 }),
      field('amenities', 'Amenities Included', 'multiselect', { options: ['WiFi', 'AC', 'Kitchen', 'Washing Machine', 'Security', 'Power Backup', 'RO Water', 'Parking'], order: 4 }),
      field('genderPreference', 'Tenant Preference', 'select', { options: ['Male Only', 'Female Only', 'Family Only', 'Any'], order: 5 }),
    ]
  },
  {
    title: 'Marriage Hall Booking',
    slug: 'marriage-hall-booking',
    homeBadge: 'Hall & Lawns',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 10,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'DAILY',
    vendorFormSchema: [
      field('hallName', 'Hall / Venue Name', 'text', { required: true, order: 1 }),
      field('indoorCapacity', 'Indoor Seating Capacity', 'number', { required: true, order: 2 }),
      field('outdoorCapacity', 'Outdoor Lawn Capacity', 'number', { order: 3 }),
      field('facilities', 'Facilities Available', 'multiselect', { required: true, options: ['AC Hall', 'Catering Kitchen', 'Decoration', 'DJ Stage', 'Green Room', 'Bridal Suite', 'Parking & Valet', 'Generator'], order: 4 }),
      field('cateringPolicy', 'Catering Policy', 'select', { required: true, options: ['In-House Only', 'Outside Allowed', 'Both Options'], order: 5 }),
    ]
  },
  {
    title: 'Security Guard Booking',
    slug: 'security-guard-booking',
    homeBadge: 'Residential & Commercial',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 11,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'MONTHLY',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('securityType', 'Security Type Offered', 'multiselect', { required: true, options: ['Residential Society', 'Commercial / Office', 'Event Security', 'Hospital / School', 'Personal Bodyguard'], order: 2 }),
      field('training', 'Certifications & Background', 'multiselect', { options: ['Ex-Serviceman', 'PSARA Licensed', 'Fire Safety Trained', 'First Aid Certified'], order: 3 }),
      field('guardsAvailable', 'Total Guards Available', 'number', { required: true, order: 4 }),
      field('shiftDuration', 'Shift Options', 'select', { required: true, options: ['8 Hours', '12 Hours', '24 Hours'], order: 5 }),
    ]
  },
  {
    title: 'Housekeeping & Home Cleaning Booking',
    slug: 'housekeeping-cleaning-booking',
    homeBadge: 'Deep Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 12,
    bookingMode: 'BOTH',
    defaultPricingModel: 'FIXED',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('cleaningTypes', 'Cleaning Services', 'multiselect', { required: true, options: ['Full Home Deep Cleaning', 'Kitchen Deep Cleaning', 'Bathroom Scrubbing', 'Sofa & Carpet Cleaning', 'Move-in/Move-out Cleaning', 'Floor Polishing'], order: 2 }),
      field('teamSize', 'Workers Team Size', 'number', { required: true, order: 3 }),
      field('equipmentIncluded', 'Chemicals & Equipment Included', 'toggle', { order: 4 }),
    ]
  },
  {
    title: 'Electrician Booking',
    slug: 'electrician-booking',
    homeBadge: 'Popular',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 13,
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Fan Installation', 'Switch & Socket Repair', 'Wiring & Short Circuit', 'MCB Box Repair', 'Inverter Setup', 'Light & Chandelier Fitting'], order: 2 }),
      field('toolsCarried', 'Tools & Safety Equipment', 'text', { helpText: 'e.g. Multimeter, Drill Machine, Safety Gloves', order: 3 }),
      field('emergencyAvailable', 'Emergency 24x7 Available', 'toggle', { order: 4 }),
    ]
  },
  {
    title: 'Plumber Booking',
    slug: 'plumber-booking',
    homeBadge: 'Popular',
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 14,
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('services', 'Services Offered', 'multiselect', { required: true, options: ['Tap & Mixer Repair', 'Pipe Leakage Fix', 'Toilet Repair & Fitting', 'Water Tank Cleaning', 'Drainage Cleaning', 'Geyser Installation'], order: 2 }),
      field('toolsCarried', 'Tools Carried', 'text', { order: 3 }),
      field('emergencyAvailable', 'Emergency Available', 'toggle', { order: 4 }),
    ]
  },
  {
    title: 'AC, Refrigerator, Washing Machine & RO Service Booking',
    slug: 'ac-refrigerator-wm-ro-service-booking',
    homeBadge: 'Popular',
    imageUrl: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 15,
    bookingMode: 'BOTH',
    defaultPricingModel: 'PER_VISIT',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('applianceTypes', 'Appliances Serviced', 'multiselect', { required: true, options: ['AC (Split/Window)', 'Refrigerator', 'Washing Machine', 'RO Water Purifier', 'Microwave', 'Geyser'], order: 2 }),
      field('acServices', 'AC & Appliance Services', 'multiselect', { options: ['Installation/Uninstallation', 'Gas Filling', 'Repair & PCB', 'Deep Foam Cleaning', 'Filter Replacement'], order: 3 }),
      field('warrantyOffered', 'Service Warranty', 'select', { options: ['7 Days', '15 Days', '30 Days', '90 Days'], order: 4 }),
    ]
  },
  {
    title: 'Pest Control Booking',
    slug: 'pest-control-booking',
    homeBadge: 'Herbal & Chemical',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    homeIconUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    showOnHome: true,
    homeOrder: 16,
    bookingMode: 'SCHEDULED',
    defaultPricingModel: 'FIXED',
    vendorFormSchema: [
      field('experienceYears', 'Years of Experience', 'number', { required: true, order: 1 }),
      field('pestTypes', 'Pests Treated', 'multiselect', { required: true, options: ['Cockroaches', 'Termites', 'Mosquitoes', 'Bed Bugs', 'Ants', 'Rodents'], order: 2 }),
      field('treatmentMethods', 'Treatment Methods', 'multiselect', { required: true, options: ['Herbal / Organic Gel', 'Chemical Spray', 'Termite Treatment', 'Fumigation'], order: 3 }),
      field('petSafety', 'Pet & Child Safe Herbal Treatment', 'toggle', { order: 4 }),
    ]
  }
];

async function seedOfficial16Categories() {
  try {
    await connectDB();
    const Category = require('../models/Category');

    console.log('Clearing old categories...');
    await Category.deleteMany({});

    console.log(`Seeding ${OFFICIAL_16_CATEGORIES.length} official ZEVYGO categories...\n`);

    for (const catData of OFFICIAL_16_CATEGORIES) {
      const created = await Category.create({
        ...catData,
        status: 'active'
      });
      console.log(`  ✅ Inserted [${created.homeOrder}]: "${created.title}" (${created.vendorFormSchema.length} form fields)`);
    }

    console.log('\n🎉 ALL 16 OFFICIAL CATEGORIES SEEDED SUCCESSFULLY WITH HD IMAGES & VENDOR FORMS!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedOfficial16Categories();
