const db = require("./db");

// =============================
// Aiven free tier hanya menyediakan
// satu database (defaultdb), jadi
// kita langsung buat tabel di situ
// (tanpa CREATE DATABASE / changeUser)
// =============================
createTables();

// =============================
// CREATE TABLES
// =============================
function createTables() {

    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            fullName VARCHAR(100) NOT NULL,
            nrp VARCHAR(30),
            role VARCHAR(20),
            institutionName VARCHAR(150),
            isActive BOOLEAN DEFAULT TRUE
        )
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS institutions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            institutionName VARCHAR(150),
            nrpCode VARCHAR(10),
            educatorUsername VARCHAR(50),
            educatorPassword VARCHAR(100),
            status VARCHAR(20),
            isActive BOOLEAN DEFAULT TRUE,
            requestedAt BIGINT
        )
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reporterUserId INT,
            isAnonymous BOOLEAN,
            reporterName VARCHAR(100),
            victimName VARCHAR(100),
            perpetratorName VARCHAR(100),
            perpetratorNrp VARCHAR(30),
            institutionName VARCHAR(150),
            location VARCHAR(255),
            date VARCHAR(50),
            description TEXT,
            evidencePaths TEXT,
            isValid BOOLEAN,
            severityLevel VARCHAR(50),
            recommendation TEXT,
            aiReason TEXT,
            status VARCHAR(100),
            adminNotes TEXT,
            spLevel INT,
            spPdfPath TEXT,
            groupId VARCHAR(100),
            timestamp BIGINT
        )
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS offenders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            nrp VARCHAR(30),
            institutionName VARCHAR(150),
            reportCount INT DEFAULT 0,
            isHighRisk BOOLEAN DEFAULT FALSE,
            lastReportTimestamp BIGINT DEFAULT 0
        )
    `, (err) => {

        if (err) throw err;

        console.log("All tables created.");

        seedData();

    });

}

function seedData() {

    // ==========================
    // SUPER ADMIN
    // ==========================
    db.query(`
        INSERT IGNORE INTO users
        (id, username, password, fullName, nrp, role, institutionName, isActive)
        VALUES
        (
            1,
            'superadmin',
            'superadmin123',
            'Super Administrator',
            '-',
            'superadmin',
            '',
            TRUE
        )
    `);

    // ==========================
    // SAMPLE INSTITUTION
    // ==========================
    db.query(`
        INSERT IGNORE INTO institutions
        (id, institutionName, nrpCode, educatorUsername, educatorPassword, status, isActive, requestedAt)
        VALUES
        (
            1,
            'Universitas Ciputra',
            '22',
            'admin_uc',
            'admin123',
            'APPROVED',
            TRUE,
            ${Date.now()}
        )
    `);

    // ==========================
    // SAMPLE ADMIN
    // ==========================
    db.query(`
        INSERT IGNORE INTO users
        (id, username, password, fullName, nrp, role, institutionName, isActive)
        VALUES
        (
            2,
            'admin_uc',
            'admin123',
            'Admin Universitas Ciputra',
            '-',
            'admin',
            'Universitas Ciputra',
            TRUE
        )
    `);

    // ==========================
    // SAMPLE USER
    // ==========================
    db.query(`
        INSERT IGNORE INTO users
        (id, username, password, fullName, nrp, role, institutionName, isActive)
        VALUES
        (
            3,
            'student1',
            '123456',
            'Student One',
            '220001',
            'user',
            'Universitas Ciputra',
            TRUE
        )
    `);

    console.log("Seeder finished.");

    process.exit();

}