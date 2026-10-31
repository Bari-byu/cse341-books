import { MongoClient } from 'mongodb';

let database;

const connectToDb = async () => {
  const connectionString = process.env.MONGODB_URL;
  if (!connectionString) {
    throw new Error('MONGODB_URL is required.');
  }

  const client = new MongoClient(connectionString);
  await client.connect();
  database = client.db(process.env.MONGODB_DB_NAME || 'practice');
  return database;
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return database;
};

export { connectToDb, getDb };