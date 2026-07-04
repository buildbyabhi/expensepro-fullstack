require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const email = process.argv[2];
    if (!email) {
      console.log('Please provide an email address: node makeAdmin.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    console.log(`Successfully made ${email} an admin!`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

makeAdmin();
