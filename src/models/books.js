import {getDb} from '../db/connect.js';

const getAllBooks = async () => {
        const db = getDb();
        const collection = db.collection('books');
        const books = await collection.find({}).toArray();
        return books;
};

const getBookById = async (bookId) => {
        const db = getDb();
        const collection = db.collection('books');
        const book = await collection.findOne({ id: bookId });
        return book;
};

const createBook = async (book) => {
  const db = getDb();
  const collection = db.collection('books');
  await collection.insertOne(book);

  return book;
};

const updateBook = async (id, book) => {
  const db = getDb();
  const collection = db.collection('books');
  await collection.updateOne({ id }, { $set: book });

  return { id, ...book };
};

const deleteBook = async (id) => {
  const db = getDb();
  const collection = db.collection('books');
  const result = await collection.deleteOne({ id });

  return result;
};

const authorHasBooks = async (id) => {
  const db = getDb();
  const collection = db.collection('books');
  const count = await collection.countDocuments({ authorId: id });

  return count > 0;
};

// Helper: does an author with this custom id exist? books.authorId points to authors.id.
const authorExists = async (authorId) => {
  const author = await getDb()
    .collection('authors')
    .findOne({ id: authorId }, { projection: { id: 1 } });

  return author !== null;
};

export { getAllBooks, getBookById, createBook, updateBook, deleteBook, authorHasBooks, authorExists };