const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Check both emails
    const user1 = await User.findOne({ email: 'kaifm9096@gmail.com' });
    const user2 = await User.findOne({ email: 'kaiftanveer943@gmail.com' });

    if (user1) {
      console.log('✅ User 1 found:');
      console.log('Email:', user1.email);
      console.log('Name:', user1.name);
      console.log('Roles:', user1.roles);
      console.log('Primary Role:', user1.primaryRole);
      console.log('User ID:', user1._id);
      console.log('---');
    } else {
      console.log('❌ kaifm9096@gmail.com not found');
    }

    if (user2) {
      console.log('✅ User 2 found:');
      console.log('Email:', user2.email);
      console.log('Name:', user2.name);
      console.log('Roles:', user2.roles);
      console.log('Primary Role:', user2.primaryRole);
      console.log('User ID:', user2._id);
      console.log('---');
    } else {
      console.log('❌ kaiftanveer943@gmail.com not found');
    }

    // Find any client user
    const anyClient = await User.findOne({ roles: 'client' });
    if (anyClient) {
      console.log('\n✅ Found a client user:');
      console.log('Email:', anyClient.email);
      console.log('Name:', anyClient.name);
      console.log('User ID:', anyClient._id);
    } else {
      console.log('\n❌ No client user found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
