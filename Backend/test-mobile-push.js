
const mongoose = require('mongoose');
const User = require('./models/User');
const { sendNotificationToUser } = require('./services/firebaseAdmin');
require('dotenv').config();

// Dummy Valid-looking FCM Token (It won't actually deliver but Firebase will accept format)
// Using a standard format token
const DUMMY_MOBILE_TOKEN = "fH8_qX9_Q_y1234567890:APA91bEf-abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890";

async function testMobilePush() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    console.log('🔍 Finding a test user...');
    const user = await User.findOne();

    if (!user) {
      console.log('❌ No users found in database.');
      process.exit(1);
    }

    console.log(`👤 Found User: ${user.name} (${user._id})`);

    // 1. Simulate Mobile Token Registration
    console.log('📲 Registering dummy mobile FCM token...');

    if (!user.fcmTokenMobile) user.fcmTokenMobile = [];
    if (!user.fcmTokenMobile.includes(DUMMY_MOBILE_TOKEN)) {
      user.fcmTokenMobile.push(DUMMY_MOBILE_TOKEN);
      await user.save();
      console.log('✅ Mobile token saved to database field: fcmTokenMobile');
    } else {
      console.log('ℹ️ Mobile token already exists.');
    }

    // 2. Test Sending Notification
    console.log('📨 Sending Push Notification to User (Mobile & Web)...');

    // We mock the admin.messaging().sendEachForMulticast to avoid error if token is invalid
    // but here we are calling the real service. 
    // If the token is fake, firebase might return an error or success with failure count.

    await sendNotificationToUser(user._id, {
      title: '📱 Mobile Test',
      body: 'Testing mobile push notification delivery!',
      data: { type: 'test' }
    });

    console.log('✅ sendNotificationToUser function executed.');
    console.log('👉 Check the console logs of your main backend server (npm run dev terminal) to see the Firebase response details.');

    // Cleanup: Remove dummy token
    // user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== DUMMY_MOBILE_TOKEN);
    // await user.save();
    // console.log('🧹 Cleaned up dummy token.');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testMobilePush();
