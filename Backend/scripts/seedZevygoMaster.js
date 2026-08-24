const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
const ServiceListing = require('../models/ServiceListing');
const { SERVICE_STATUS, VENDOR_STATUS, LISTING_STATUS } = require('../utils/constants');

dotenv.config();

// Helper to get category specific images
const getCategoryImage = (categoryTitle) => {
  const title = categoryTitle.toLowerCase();
  if (title.includes('driver')) return 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=80';
  if (title.includes('cook') || title.includes('maharaj') || title.includes('tiffin')) return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80';
  if (title.includes('worker') || title.includes('helper') || title.includes('housekeeping') || title.includes('cleaning')) return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';
  if (title.includes('dj') || title.includes('sound')) return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80';
  if (title.includes('photographer') || title.includes('video')) return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80';
  if (title.includes('makeup')) return 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80';
  if (title.includes('health') || title.includes('nurse')) return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80';
  if (title.includes('room') || title.includes('rental')) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80';
  if (title.includes('marriage') || title.includes('hall')) return 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80';
  if (title.includes('security') || title.includes('guard')) return 'https://images.unsplash.com/photo-1534312527009-56c7016453e6?auto=format&fit=crop&w=400&q=80';
  if (title.includes('electrician')) return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80';
  if (title.includes('plumber')) return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80';
  if (title.includes('ac') || title.includes('refrigerator') || title.includes('ro')) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=400&q=80';
  if (title.includes('pest')) return 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?auto=format&fit=crop&w=400&q=80';
  return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80';
};

const getVendorProfileImage = (index) => {
  const images = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  ];
  return images[index % images.length];
};

const DUMMY_DOC = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80';

const seedZevygoMaster = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Homster';
    console.log(`🔌 Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. Wipe old data
    console.log('🗑️  Wiping old Brands, Services, Vendors, and ServiceListings...');
    await Brand.deleteMany({});
    await Service.deleteMany({});
    await Vendor.deleteMany({});
    await ServiceListing.deleteMany({});
    console.log('✅ Wiped old data successfully.\n');

    // 2. Fetch all existing Categories
    const categories = await Category.find({}).sort({ homeOrder: 1 });
    if (categories.length === 0) {
      console.log('❌ No categories found! Please run `npm run seed:categories` or `seedOfficial16Categories.js` first.');
      process.exit(1);
    }
    console.log(`📦 Found ${categories.length} Categories. Beginning Master Seed...\n`);

    let vendorCounter = 1;

    for (const category of categories) {
      console.log(`\n===========================================`);
      console.log(`🚀 Processing Category: ${category.title}`);
      console.log(`===========================================`);

      // 3. Seed Brands for this category
      const brandData = {
        title: `Generic ${category.title}`,
        slug: `generic-${category.slug}`,
        categoryIds: [category._id],
        categoryId: category._id,
        status: SERVICE_STATUS.ACTIVE,
        isPopular: true,
        iconUrl: category.homeIconUrl || 'https://cdn-icons-png.flaticon.com/512/771/771234.png'
      };

      const brand = await Brand.create(brandData);
      console.log(`   ✅ Created Brand: ${brand.title}`);

      // 4. Seed Services for this Brand
      const serviceData = [
        {
          title: `Basic ${category.title} Service`,
          slug: `basic-${category.slug}-service`,
          brandId: brand._id,
          basePrice: 299,
          gstPercentage: 18,
          status: SERVICE_STATUS.ACTIVE,
          description: `Standard service package for ${category.title}`
        },
        {
          title: `Premium ${category.title} Service`,
          slug: `premium-${category.slug}-service`,
          brandId: brand._id,
          basePrice: 599,
          gstPercentage: 18,
          status: SERVICE_STATUS.ACTIVE,
          description: `Premium high-quality service package for ${category.title}`
        }
      ];

      const services = await Service.insertMany(serviceData);
      console.log(`   ✅ Created ${services.length} Services under Brand "${brand.title}"`);

      // 5. Seed Vendors for this category
      for (let i = 1; i <= 2; i++) {
        const vendorName = `Vendor ${vendorCounter}`;
        const vendorEmail = `vendor${vendorCounter}@zevygo.com`;
        const vendorPhone = `90000000${vendorCounter.toString().padStart(2, '0')}`;

        const newVendor = new Vendor({
          name: vendorName,
          email: vendorEmail,
          phone: vendorPhone,
          password: 'password123', // Will be hashed via pre-save hook
          role: 'vendor',
          approvalStatus: VENDOR_STATUS.APPROVED,
          accountStatus: 'ACTIVE',
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          businessName: `${vendorName} Services`,
          categoryEnrollments: [{
            categoryId: category._id,
            status: VENDOR_STATUS.APPROVED,
            documents: []
          }],
          aadhar: {
            number: `1234567890${vendorCounter.toString().padStart(2, '0')}`,
            document: DUMMY_DOC,
            backDocument: DUMMY_DOC
          },
          pan: {
            number: `ABCDE1234${vendorCounter.toString().substring(0, 1)}`,
            document: DUMMY_DOC
          },
          address: {
            fullAddress: 'Main Market, Indore',
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452001',
            lat: 22.7196 + (Math.random() * 0.05), // Scatter vendors slightly in Indore
            lng: 75.8577 + (Math.random() * 0.05)
          },
          geoLocation: {
            type: 'Point',
            coordinates: [75.8577 + (Math.random() * 0.05), 22.7196 + (Math.random() * 0.05)]
          },
          profilePhoto: getVendorProfileImage(vendorCounter),
          rating: (Math.random() * (5 - 4) + 4).toFixed(1), // Random rating between 4.0 and 5.0
          totalJobs: Math.floor(Math.random() * 100) + 10,
          completedJobs: Math.floor(Math.random() * 100) + 10
        });

        await newVendor.save();
        console.log(`      👷 Created Vendor: ${vendorName} (${vendorPhone})`);

        // 6. Seed ServiceListing for this Vendor
        const listing = new ServiceListing({
          vendorId: newVendor._id,
          categoryId: category._id,
          categoryName: category.title,
          title: `${vendorName}'s ${category.title} Offerings`,
          status: LISTING_STATUS.APPROVED,
          experience: Math.floor(Math.random() * 10) + 1,
          bookingMode: 'BOTH',
          pricingModel: category.defaultPricingModel || 'FIXED',
          pricing: {
            basePrice: 199,
            hourlyRate: 299
          },
          availability: {
            isAvailableNow: true,
            workingDays: {
              monday: { isOpen: true, shifts: [{ start: "09:00", end: "18:00" }] },
              tuesday: { isOpen: true, shifts: [{ start: "09:00", end: "18:00" }] },
              wednesday: { isOpen: true, shifts: [{ start: "09:00", end: "18:00" }] },
              thursday: { isOpen: true, shifts: [{ start: "09:00", end: "18:00" }] },
              friday: { isOpen: true, shifts: [{ start: "09:00", end: "18:00" }] },
              saturday: { isOpen: true, shifts: [{ start: "09:00", end: "18:00" }] },
              sunday: { isOpen: false, shifts: [] }
            }
          },
          serviceArea: {
            city: 'Indore',
            radiusKm: 15
          },
          catalogItems: services.map(s => ({
            serviceId: s._id,
            title: s.title,
            price: s.basePrice,
            isAvailable: true,
            photoUrl: getCategoryImage(category.title)
          }))
        });

        // Also add portfolioPhotos based on category
        listing.portfolioPhotos = [
          getCategoryImage(category.title),
          getCategoryImage(category.title + ' alternative')
        ];

        await listing.save();
        console.log(`         📋 Created Service Listing for ${vendorName}`);

        vendorCounter++;
      }
    }

    console.log('\n🎉 ALL DONE! Master Database Seeding Completed Successfully.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during Master Seeding:', error);
    process.exit(1);
  }
};

seedZevygoMaster();
