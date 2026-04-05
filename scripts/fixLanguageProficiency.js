const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const fixData = async () => {
  await connectDB();

  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Fix language proficiency - convert capitalized to lowercase
    const usersWithLanguages = await usersCollection.find({ 'languages.0': { $exists: true } }).toArray();
    
    console.log(`Found ${usersWithLanguages.length} users with languages`);
    
    for (const user of usersWithLanguages) {
      const updatedLanguages = user.languages.map(lang => ({
        ...lang,
        proficiency: lang.proficiency ? lang.proficiency.toLowerCase() : lang.proficiency
      }));
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { languages: updatedLanguages } }
      );
      console.log(`Fixed languages for user: ${user.email}`);
    }
    
    // Fix KYC status - set to null if pending but no documents submitted
    const result = await usersCollection.updateMany(
      { 
        'kyc.status': 'pending',
        'kyc.documentNumber': { $in: [null, ''] },
        'kyc.documentImage': { $in: [null, ''] }
      },
      { $set: { 'kyc.status': null } }
    );
    
    console.log(`Reset KYC status for ${result.modifiedCount} users`);
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

fixData();
