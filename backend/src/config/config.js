// src/config/config.js 또는 다른 위치
const path = require('path');
const dotenvPath = path.resolve(process.cwd(), '.env');
require('dotenv').config({ path: dotenvPath });

console.log("✅ Loaded DB Config for:", process.env.DB_NAME);

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'samspeak_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
  },
};
