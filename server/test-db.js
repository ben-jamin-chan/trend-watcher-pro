// test-db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB Atlas:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('This might be due to network issues or incorrect connection string.');
      console.error('Check your MONGODB_URI in .env file and make sure your IP is whitelisted.');
    }
  }
}

testConnection();