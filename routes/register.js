const express = require("express");
const { Pool } = require("pg"); // Якщо використовуєш pg
const router = express.Router();
require("dotenv").config();

// Підключення до БД
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Роут для реєстрації користувача
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Перевірка на наявність користувача
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Користувач вже існує" });
    }

    // Додавання нового користувача
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, password]
    );

    res.status(201).json({ message: "Користувач успішно зареєстрований", user: newUser.rows[0] });
  } catch (error) {
    console.error("Помилка реєстрації:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

module.exports = router;
