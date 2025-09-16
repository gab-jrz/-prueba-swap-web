import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    dbName: 'test',
  });
}

export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function closeDatabase() {
  try {
    await mongoose.connection.dropDatabase();
  } catch {}
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
}