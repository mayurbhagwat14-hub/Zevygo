const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const HomeContent = require('../models/HomeContent');

const realisticMostBooked = [
  {
    title: "AC Service & Gas Refill",
    rating: "4.88",
    reviews: "120K",
    price: "599",
    originalPrice: "799",
    discount: "25% OFF",
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80",
    order: 1
  },
  {
    title: "Fridge Repair & Checkup",
    rating: "4.85",
    reviews: "85K",
    price: "299",
    originalPrice: "499",
    discount: "40% OFF",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    order: 2
  },
  {
    title: "On-Demand Personal Driver",
    rating: "4.92",
    reviews: "210K",
    price: "399",
    originalPrice: "500",
    discount: "20% OFF",
    imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80",
    order: 3
  },
  {
    title: "Full Home Deep Cleaning",
    rating: "4.84",
    reviews: "95K",
    price: "1,499",
    originalPrice: "2,199",
    discount: "31% OFF",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
    order: 4
  },
  {
    title: "Cook & Maharaj for Home",
    rating: "4.90",
    reviews: "140K",
    price: "799",
    originalPrice: "1,000",
    discount: "20% OFF",
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80",
    order: 5
  },
  {
    title: "Electrician Repair & Wiring",
    rating: "4.82",
    reviews: "64K",
    price: "199",
    originalPrice: "299",
    discount: "33% OFF",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
    order: 6
  },
  {
    title: "Washing Machine Service",
    rating: "4.80",
    reviews: "78K",
    price: "349",
    originalPrice: "499",
    discount: "30% OFF",
    imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
    order: 7
  },
  {
    title: "Plumbing Leakage Repair",
    rating: "4.86",
    reviews: "52K",
    price: "249",
    originalPrice: "350",
    discount: "28% OFF",
    imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80",
    order: 8
  }
];

const realisticNoteworthy = [
  {
    title: "Daily Home Tiffin Service",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    order: 1
  },
  {
    title: "DJ & Sound System Setup",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    order: 2
  },
  {
    title: "Event Photographer & Reels",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    order: 3
  },
  {
    title: "Bridal & Party Makeup",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80",
    order: 4
  },
  {
    title: "Healthcare Nurse & Attendant",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80",
    order: 5
  },
  {
    title: "Banquet & Marriage Hall Booking",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80",
    order: 6
  }
];

const realisticCurated = [
  {
    title: "Instant 30-Min Doorstep Electrician",
    gifUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
    order: 1
  },
  {
    title: "Outstation Personal Driver Booking",
    gifUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80",
    order: 2
  },
  {
    title: "Deep Sanitized Bathroom Cleaning",
    gifUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
    order: 3
  },
  {
    title: "Experienced Maharaj & Home Chef",
    gifUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80",
    order: 4
  }
];

async function seedData() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI environment variable not found');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const result = await HomeContent.updateMany(
      {},
      {
        $set: {
          booked: realisticMostBooked,
          noteworthy: realisticNoteworthy,
          curated: realisticCurated,
          isBookedVisible: true,
          isNoteworthyVisible: true,
          isCuratedVisible: true
        }
      }
    );

    console.log(`Updated ${result.modifiedCount || result.nModified || 0} HomeContent documents with clean Zevygo seed data.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
