import mongoose from 'mongoose';

let mongodInstance: any = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Attempting connection to configured MONGODB_URI...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log(`[Database] Successfully connected to MongoDB at ${uri.split('@').pop()}`);
      return;
    } catch (err: any) {
      console.warn(`[Database] External MongoDB connection failed (${err.message}). Falling back to in-memory database.`);
    }
  }

  // Fallback to in-memory MongoDB for seamless zero-config demo & testing
  try {
    console.log(`[Database] Initializing In-Memory MongoDB Server for out-of-the-box demo mode...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Successfully connected to In-Memory MongoDB (${memoryUri})`);
  } catch (err: any) {
    console.error(`[Database] Critical error initializing database:`, err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log(`[Database] Database disconnected.`);
  } catch (err) {
    console.error(`[Database] Error during disconnect:`, err);
  }
}
