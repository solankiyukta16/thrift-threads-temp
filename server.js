const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse form data and JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML/CSS files from the "public" folder
app.use(express.static('public'));

// Connect to SQLite Database (creates a simple database.db file)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create basic tables if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            price REAL NOT NULL,
            description TEXT,
            image TEXT,
            seller_id INTEGER,
            FOREIGN KEY(seller_id) REFERENCES users(id)
        )`);
    }
});

// --- Simple API Routes for our front-end ---

// 1. Sign Up API
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, password], function (err) {
        if (err) {
            return res.status(400).json({ error: "Email already exists or invalid data." });
        }
        res.json({ success: true, user: { id: this.lastID, name: name, email: email } });
    });
});

// 2. Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT id, name, email FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Invalid email or password." });
        }
        res.json({ success: true, user: user });
    });
});

// 3. Get All Products API
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows); // Send the rows back as JSON
    });
});

// 3.5 Get Single Product API
app.get('/api/products/:id', (req, res) => {
    db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Not found" });
        res.json(row);
    });
});

// 4. Add a Product (Sell) API
app.post('/api/products', (req, res) => {
    const { name, category, price, description, image, seller_id } = req.body;
    db.run(`INSERT INTO products (name, category, price, description, image, seller_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, category, Number(price), description, image, parseInt(seller_id)], function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        });
});

// 5. Delete a Product API
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Open your browser and go to: http://localhost:${port}`);
});
