const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createClient() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if client already exists
    const existingClient = await User.findOne({ email: 'client@workdeck.com' });
    if (existingClient) {
      console.log('Client user already exists');
      console.log('Email:', existingClient.email);
      console.log('User ID:', existingClient._id);
      process.exit(0);
    }

    // Create client user
    const client = await User.create({
      name: 'Tech Solutions Inc',
      email: 'client@workdeck.com',
      password: 'Client@123',
      roles: ['client'],
      primaryRole: 'client',
      isVerified: true,
      location: 'United States',
      companySize: '50-200',
      industry: 'Technology'
    });

    console.log('✅ Client user created successfully!');
    console.log('Email: client@workdeck.com');
    console.log('Password: Client@123');
    console.log('User ID:', client._id);

    process.exit(0);
  } catch (error) {
    console.error('Error creating client user:', error);
    process.exit(1);
  }
}

createClient();
