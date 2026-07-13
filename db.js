require("dotenv").config();

const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// ==============================
// SSL untuk koneksi ke Aiven
// (Aiven MySQL wajib pakai SSL)
// ==============================
let sslOption = undefined;

if (process.env.DB_CA_CERT) {

    sslOption = {
        ca: process.env.DB_CA_CERT
    };

} else if (process.env.DB_CA_PATH) {

    sslOption = {
        ca: fs.readFileSync(path.resolve(process.env.DB_CA_PATH))
    };

} else {

    sslOption = {
        rejectUnauthorized: false
    };

}

// ==============================
// Pakai CONNECTION POOL
// (lebih stabil untuk hosting serverless
// seperti Leapcell, dibanding koneksi tunggal)
// ==============================
const pool = mysql.createPool({

    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslOption,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0

});

pool.getConnection((err, connection) => {

    if (err) {
        console.error("MySQL connection error:", err);
        return;
    }

    console.log("MySQL Connected to", process.env.DB_HOST);
    connection.release();

});

module.exports = pool;
