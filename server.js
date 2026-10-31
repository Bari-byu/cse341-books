//import express from "express";
import app from './app.js';
import { connectToDb } from './src/db/connect.js';
//import {getDb} from './src/db/connect.js';

const PORT = process.env.PORT;

if (!PORT) {
    throw new Error('PORT is not defined. Make sure your local npm scripts reference the .env file with --env-file=.env, or define PORT in your hosted environment settings.');
}

const startServer = async () => {
  try {
    await connectToDb();
    const books = await getDb().collection('books').find({}).toArray();
    //console.log('Book documents:', books);
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

await startServer();