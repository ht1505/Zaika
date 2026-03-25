import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is not configured. Create either server/.env or restaurant-voice-order-system/.env and set MONGODB_URI.'
    );
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true
  });

  console.log('MongoDB connected');
};
