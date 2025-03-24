const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  dialect: "postgres",
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Синхронізуємо таблицю
sequelize.sync()
  .then(() => console.log("Таблиця users синхронізована"))
  .catch((err) => console.error("Помилка синхронізації:", err));

module.exports = User;
