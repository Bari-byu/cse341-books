import {
  getAllBooks,
  getBookById,
  createBook as createBookFromDb,
  updateBook as updateBookFromDb,
  deleteBook as deleteBookFromDb,
  authorExists,
} from '../models/books.js';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isJsonObject = (body) => {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
};

// Trims strings. Anything that is not a string becomes '' so it fails validation.
const cleanString = (value) => {
  return typeof value === 'string' ? value.trim() : '';
};

// True only for real calendar dates in YYYY-MM-DD format (2026-02-31 is rejected).
const isRealIsoDate = (value) => {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// Returns the names of the fields that are missing or invalid.
const validateBookBody = (body, { requireId }) => {
  const invalidFields = [];

  if (requireId && !ID_PATTERN.test(cleanString(body.id))) {
    invalidFields.push('id');
  }

  if (!ID_PATTERN.test(cleanString(body.authorId))) {
    invalidFields.push('authorId');
  }

  const title = cleanString(body.title);
  if (title.length < 1 || title.length > 200) {
    invalidFields.push('title');
  }

  if (!isRealIsoDate(cleanString(body.publicationDate))) {
    invalidFields.push('publicationDate');
  }

  return invalidFields;
};

const invalidFieldsMessage = (invalidFields) => {
  return `Missing or invalid required field(s): ${invalidFields.join(', ')}`;
};

const sendServerError = (res, routeLabel, error) => {
  console.error(`${routeLabel} failed:`, error.message);
  return res.status(500).json({ message: 'Internal server error' });
};

const getBooksHandler = async (req, res) => {
  try {
    const books = await getAllBooks();
    return res.status(200).json(books);
  } catch (error) {
    return sendServerError(res, 'GET /books', error);
  }
};

const getBookByIdHandler = async (req, res) => {
  const requestedId = req.params.id;

  try {
    const book = await getBookById(requestedId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return sendServerError(res, 'GET /books/:id', error);
  }
};

const createBook = async (req, res) => {
  try {
    if (!isJsonObject(req.body)) {
      return res.status(400).json({ message: 'Request body must be a JSON object' });
    }

    // 1. Validate id, authorId, title, and publicationDate.
    const invalidFields = validateBookBody(req.body, { requireId: true });
    if (invalidFields.length > 0) {
      return res.status(400).json({ message: invalidFieldsMessage(invalidFields) });
    }

    // Only these four fields are copied, so extras (such as _id) are ignored.
    const newBook = {
      id: cleanString(req.body.id),
      authorId: cleanString(req.body.authorId),
      title: cleanString(req.body.title),
      publicationDate: cleanString(req.body.publicationDate),
    };

    // 2. Reject a duplicate id.
    const existingBook = await getBookById(newBook.id);
    if (existingBook) {
      return res.status(400).json({ message: 'A book with this id already exists' });
    }

    // 3. Reject an authorId that does not match an existing author.
    if (!(await authorExists(newBook.authorId))) {
      return res.status(400).json({ message: 'authorId does not match an existing author' });
    }

    const createdBook = await createBookFromDb(newBook);
    return res.status(201).json(createdBook);
  } catch (error) {
    // Duplicate key error from a unique index on books.id (two requests at once).
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A book with this id already exists' });
    }
    return sendServerError(res, 'POST /books', error);
  }
};

const updateBook = async (req, res) => {
  const requestedId = req.params.id;

  try {
    if (!isJsonObject(req.body)) {
      return res.status(400).json({ message: 'Request body must be a JSON object' });
    }

    // 1. Validate authorId, title, and publicationDate.
    const invalidFields = validateBookBody(req.body, { requireId: false });
    if (invalidFields.length > 0) {
      return res.status(400).json({ message: invalidFieldsMessage(invalidFields) });
    }

    // 2. The book must exist (404).
    const existingBook = await getBookById(requestedId);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // The id comes from the URL and cannot change, so any id in the body is ignored.
    const changes = {
      authorId: cleanString(req.body.authorId),
      title: cleanString(req.body.title),
      publicationDate: cleanString(req.body.publicationDate),
    };

    // 3. Reject an authorId that does not match an existing author.
    if (!(await authorExists(changes.authorId))) {
      return res.status(400).json({ message: 'authorId does not match an existing author' });
    }

    const updatedBook = await updateBookFromDb(requestedId, changes);
    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(updatedBook);
  } catch (error) {
    return sendServerError(res, 'PUT /books/:id', error);
  }
};

const deleteBook = async (req, res) => {
  const requestedId = req.params.id;

  try {
    const deletedCount = await deleteBookFromDb(requestedId);

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return sendServerError(res, 'DELETE /books/:id', error);
  }
};

export { getBooksHandler, getBookByIdHandler, createBook, updateBook, deleteBook };
