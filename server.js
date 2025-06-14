const express = require("express");
const { Pool } = require("pg");
require("dotenv").config(); // Завантажуємо змінні з .env
const path = require('path');

const app = express();
const port = 5000;

const registerRoute = require("./routes/register");
app.use("/api", registerRoute);

// Налаштування з .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json()); // вбудований middleware для парсингу JSON
app.use(express.static(path.join(__dirname, 'html'))); // статичні файли
app.use('/css', express.static(path.join(__dirname, 'css')));  // для стилів
app.use('/script', express.static(path.join(__dirname, 'script')));  // для скриптів
app.use('/img', express.static(path.join(__dirname, 'img')));  // для фото

// Маршрут для головної сторінки
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'home_page.html')); // головна сторінка
});

// Додаємо маршрути для інших сторінок
app.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'registration.html')); // сторінка реєстрації
});

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'order.html')); // сторінка реєстрації
});

app.get('/person', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'person.html')); // сторінка реєстрації
});


app.get('/authorization', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'authorization.html')); // сторінка авторизації
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'products.html')); // сторінка продуктів
});

app.get('/flat_products', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'flat_products.html')); // сторінка продуктів
});

app.get('/square_products', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'square_products.html')); // сторінка продуктів
});

// Роут для реєстрації користувача
app.post("/register", async (req, res) => {
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

    // Відправка відповіді
    res.status(201).json({
      message: "Користувач успішно зареєстрований",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Помилка реєстрації:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
