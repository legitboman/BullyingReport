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

    // Isi sertifikat langsung ditaruh di environment variable
    // (dipakai saat deploy ke Render, dsb)
    sslOption = {
        ca: process.env.DB_CA_CERT
    };

} else if (process.env.DB_CA_PATH) {

    // Path ke file ca.pem di komputer lokal
    sslOption = {
        ca: fs.readFileSync(path.resolve(process.env.DB_CA_PATH))
    };

} else {

    // Fallback: tetap pakai SSL tapi tidak verifikasi CA
    // (lebih longgar, cukup untuk development)
    sslOption = {
        rejectUnauthorized: false
    };

}

const db = mysql.createConnection({

    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslOption

});

db.connect((err) => {

    if (err) {
        console.error("MySQL connection error:", err);
        return;
    }

    console.log("MySQL Connected to", process.env.DB_HOST);

});

module.exports = db;
