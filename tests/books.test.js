const request = require("supertest");
const app = require("../app"); // Assuming your Express app is exported from app.js
const db = require("../db");
const Book = require("../models/book");

process.env.NODE_ENV = "test";

const validBook = {
    title: "Test Book 1",
    isbn: "12345",
    pages: 100,
    publisher: "Test Publisher",
    author: "Test Author",
    amazon_url: "https://www.amazon.com/test-book-1",
    year: 2020,
    language: "English",
};

const invalidBook = {
    title: "Test Book 2",
    isbn: "67890",
    pages: "one hundred",
    publisher: "Test Publisher",
    author: 100,
    amazon_url: "test-book-2",
    year: "two thousand and twenty",
    language: "English",
};

const testBook = {
    title: "Test Book",
    isbn: "98765",
    pages: 100,
    publisher: "Test Co.",
    author: "Test Author Sr.",
    amazon_url: "https://www.amazon.com/test-book",
    year: 2019,
    language: "English",
};

beforeAll (async () => {
    await db.query("DELETE FROM books");
    await Book.create(testBook);
});

afterAll(async () => {
    try {
        await db.end();
        console.log("Database connection closed.");
    } catch (err) {
        console.error("Error closing the database connection:", err);
    }
});

describe("GET /books", () => {
    it("should return a list of books", async () => {
        const res = await request(app).get("/books");

        expect(res.statusCode).toBe(200);
        console.log(res.body);
        expect(res.body).toEqual({ books: [testBook] });
    });

    it("should handle errors", async () => {
        Book.findAll = jest.fn();
        Book.findAll.mockRejectedValue(new Error("Database error"));

        const res = await request(app).get("/books");

        expect(res.statusCode).toBe(500);
    });
    
});

describe("GET /books/:id", () => {
    it("should return a single book", async () => {
        const res = await request(app).get("/books/98765");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ book: testBook });
    });

    it("should return 404 if book not found", async () => {
        const res = await request(app).get("/books/12345");

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toEqual("There is no book with an isbn '12345'");
    });

    it("should handle errors", async () => {
        Book.findOne = jest.fn();
        Book.findOne.mockRejectedValue(new Error("Database error"));

        const res = await request(app).get("/books/98765");

        expect(res.statusCode).toBe(500);
    });
});

describe("POST /books", () => {
    it("should create a new book", async () => {
        const res = await request(app).post("/books").send(validBook);

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ book: validBook });
    });

    it("should handle validation errors", async () => {
        const res = await request(app).post("/books").send(invalidBook);

        expect(res.statusCode).toBe(400);
    });

    it("should handle other errors", async () => {
        Book.create = jest.fn();
        Book.create.mockRejectedValue(new Error("Database error"));

        const res = await request(app)
            .post("/books")
            .send(validBook);

        expect(res.statusCode).toBe(500);
    });
});

describe("PUT /books/:isbn", () => {
    it("should update a book", async () => {
        const body = Object.assign({}, testBook, { title: "Updated Book" });
        const res = await request(app).put("/books/98765").send(body);

        expect(res.statusCode).toBe(200);
        expect(res.body.book.title).toEqual("Updated Book");
    });

    it("should handle validation errors", async () => {
        const body = Object.assign({}, testBook, {
            amazon_url: "Invalid_url",
        });
        const res = await request(app).put("/books/98765").send(body);

        expect(res.statusCode).toBe(400);
    });

    it("should handle other errors", async () => {
        Book.update = jest.fn();
        Book.update.mockRejectedValue(new Error("Database error"));

        const res = await request(app)
            .put("/books/12345")
            .send(validBook);

        expect(res.statusCode).toBe(500);
    });
});

describe("DELETE /books/:isbn", () => {
    it("should delete a book", async () => {
        const res = await request(app).delete("/books/98765");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Book deleted" });
    });

    it("should return 404 if book not found", async () => {
        const res = await request(app).delete("/books/98765");

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toEqual("There is no book with an isbn '98765'");
    });

    it("should handle errors", async () => {
        Book.remove = jest.fn();
        Book.remove.mockRejectedValue(new Error("Database error"));

        const res = await request(app).delete("/books/12345");

        expect(res.statusCode).toBe(500);
    });
});
