require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{

    res.json({
        success:true,
        message:"Bullying Report API Running"
    });

});

app.get("/institutions",(req,res)=>{

    db.query(
        "SELECT * FROM institutions",
        (err,result)=>{

            if(err){

                return res.json({
                    success:false,
                    message:err.message
                });

            }

            res.json({
                success:true,
                data:result
            });

        }
    );

});

app.get("/users",(req,res)=>{

    db.query(
        "SELECT * FROM users",
        (err,result)=>{

            if(err){

                return res.json({
                    success:false,
                    message:err.message
                });

            }

            const data = result.map(user => ({

                ...user,
            
                isActive: user.isActive == 1
            
            }));
            
            res.json({
            
                success:true,
            
                data
            
            });

        }
    );

});

// ==============================
// GET USER BY USERNAME
// ==============================

app.get("/users/username/:username", (req, res) => {

    const username = req.params.username;

    db.query(

        "SELECT * FROM users WHERE username=? LIMIT 1",

        [username],

        (err, result) => {

            if (err) {

                return res.json({
                    success: false,
                    message: err.message
                });

            }

            if (result.length == 0) {

                return res.json({
                    success: false,
                    message: "User tidak ditemukan."
                });

            }

            const user = result[0];

            delete user.password;

            res.json({

                success: true,
                data: user

            });

        }

    );

});


app.get("/users/admin", (req, res) => {

    db.query(

        `
        SELECT *
        FROM users

        WHERE role='admin'

        ORDER BY institutionName ASC
        `,

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(user => ({

                ...user,
            
                isActive: user.isActive == 1
            
            }));
            
            res.json({
            
                success:true,
            
                data
            
            });

        }

    );

});

app.post("/register", (req, res) => {

    const {

        username,
        password,
        fullName,
        nrp

    } = req.body;

    // Semua yang register dari aplikasi otomatis menjadi user/siswa
    const role = "user";

    // Institution akan diisi saat login berdasarkan 2 digit awal NRP
    const institutionName = "";

    db.query(

        `
        INSERT INTO users
        (
            username,
            password,
            fullName,
            nrp,
            role,
            institutionName,
            isActive
        )
        VALUES
        (
            ?,?,?,?,?,?,?
        )
        `,

        [

            username,
            password,
            fullName,
            nrp,
            role,
            institutionName,
            true

        ],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            res.json({

                success: true,
                message: "Register berhasil"

            });

        }

    );

});

// ==============================
// REGISTER INSTITUTION
// ==============================

// ==============================
// REGISTER INSTITUTION
// ==============================

app.post("/institutions", (req, res) => {

    const {

        institutionName,
        nrpCode,
        educatorUsername,
        educatorPassword

    } = req.body;

    // cek kode NRP
    db.query(

        "SELECT * FROM institutions WHERE nrpCode=? LIMIT 1",

        [nrpCode],

        (err, codeResult) => {

            if (err) {

                return res.json({
                    success: false,
                    message: err.message
                });

            }

            if (codeResult.length > 0) {

                return res.json({

                    success: false,
                    message: "Kode NRP sudah digunakan."

                });

            }

            // cek username educator pada institutions

            db.query(

                "SELECT * FROM institutions WHERE educatorUsername=? LIMIT 1",

                [educatorUsername],

                (err, institutionResult) => {

                    if (err) {

                        return res.json({

                            success: false,
                            message: err.message

                        });

                    }

                    if (institutionResult.length > 0) {

                        return res.json({

                            success: false,
                            message: "Username sudah digunakan."

                        });

                    }

                    // cek username di tabel users

                    db.query(

                        "SELECT * FROM users WHERE username=? LIMIT 1",

                        [educatorUsername],

                        (err, userResult) => {

                            if (err) {

                                return res.json({

                                    success: false,
                                    message: err.message

                                });

                            }

                            if (userResult.length > 0) {

                                return res.json({

                                    success: false,
                                    message: "Username sudah digunakan."

                                });

                            }

                            // insert institution

                            db.query(

                                `
                                INSERT INTO institutions
                                (
                                    institutionName,
                                    nrpCode,
                                    educatorUsername,
                                    educatorPassword,
                                    status,
                                    isActive,
                                    requestedAt
                                )

                                VALUES(?,?,?,?,?,?,?)
                                `,

                                [

                                    institutionName,
                                    nrpCode,
                                    educatorUsername,
                                    educatorPassword,
                                    "PENDING",
                                    true,
                                    Date.now()

                                ],

                                (err) => {

                                    if (err) {

                                        return res.json({

                                            success: false,
                                            message: err.message

                                        });

                                    }

                                    res.json({

                                        success: true,
                                        message: "Permintaan registrasi berhasil dikirim."

                                    });

                                }

                            );

                        }

                    );

                }

            );

        }

    );

});

app.post("/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    db.query(

        `
        SELECT *
        FROM users
        WHERE username = ?
        AND password = ?
        LIMIT 1
        `,

        [username, password],

        (err, result) => {

            if (err) {

                return res.json({
                    success: false,
                    message: err.message
                });

            }

            if (result.length === 0) {

                return res.json({
                    success: false,
                    message: "Username atau password salah."
                });

            }

            const user = {

                ...result[0],
            
                isActive: result[0].isActive == 1
            
            };
            // ============================
            // SUPER ADMIN
            // ============================

            if (user.role === "superadmin") {

                return res.json({

                    success: true,
                    message: "Login berhasil.",
                    user

                });

            }

            // ============================
            // ADMIN
            // ============================

            if (user.role === "admin") {

                db.query(

                    `
                    SELECT *
                    FROM institutions
                    WHERE educatorUsername = ?
                    LIMIT 1
                    `,

                    [user.username],

                    (err, institutionResult) => {

                        if (err) {

                            return res.json({
                                success: false,
                                message: err.message
                            });

                        }

                        if (institutionResult.length === 0) {

                            return res.json({
                                success: false,
                                message: "Institusi tidak ditemukan."
                            });

                        }

                        const institution = {

                            ...institutionResult[0],
                        
                            isActive: institutionResult[0].isActive == 1
                        
                        };

                        if (
                            institution.status !== "APPROVED" ||
                            !institution.isActive ||
                            !user.isActive
                        ) {

                            return res.json({
                                success: false,
                                message: "Akun institusi belum disetujui atau sudah tidak aktif."
                            });

                        }

                        user.institutionName = institution.institutionName;

                        return res.json({

                            success: true,
                            message: "Login berhasil.",
                            user

                        });

                    }

                );

                return;

            }

            // ============================
            // USER
            // ============================

            const code = user.nrp.substring(0, 2);

            db.query(

                `
                SELECT *
                FROM institutions
                WHERE nrpCode = ?
                LIMIT 1
                `,

                [code],

                (err, institutionResult) => {

                    if (err) {

                        return res.json({
                            success: false,
                            message: err.message
                        });

                    }

                    if (institutionResult.length === 0) {

                        return res.json({
                            success: false,
                            message: "Institusi tidak ditemukan."
                        });

                    }

                    const institution = {

                        ...institutionResult[0],

                        isActive: institutionResult[0].isActive == 1

                    };
                    if (
                        institution.status !== "APPROVED" ||
                        !institution.isActive
                    ) {

                        return res.json({
                            success: false,
                            message: "Institusi sudah tidak aktif."
                        });

                    }

                    user.institutionName = institution.institutionName;

                    return res.json({

                        success: true,
                        message: "Login berhasil.",
                        user

                    });

                }

            );

        }

    );

});
// ==============================
// GET PENDING INSTITUTIONS
// ==============================

app.get("/institutions/pending", (req, res) => {

    db.query(
        `
        SELECT *
        FROM institutions
        WHERE status='PENDING'
        `,
        (err, result) => {

            if (err) {

                return res.json({
                    success:false,
                    message:err.message
                });

            }

            const data = result.map(item => ({

                ...item,

                isActive: item.isActive == 1

            }));

            res.json({

                success:true,

                data

            });

        }
    );

});

// ==============================
// GET APPROVED INSTITUTIONS
// ==============================

app.get("/institutions/approved", (req, res) => {

    db.query(

        "SELECT * FROM institutions WHERE status='APPROVED' ORDER BY institutionName",

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(item => ({

                ...item,
            
                isActive: item.isActive == 1
            
            }));
            
            res.json({
            
                success:true,
            
                data
            
            });

        }

    );

});

// ==============================
// GET ACTIVE APPROVED INSTITUTIONS
// ==============================

app.get("/institutions/active", (req, res) => {

    db.query(

        `
        SELECT *
        FROM institutions

        WHERE status='APPROVED'
        AND isActive=1

        ORDER BY institutionName
        `,

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(item => ({

                ...item,
            
                isActive: item.isActive == 1
            
            }));
            
            res.json({
            
                success: true,
                data
            
            });
        }

    );

});

// ==============================
// GET INSTITUTION BY EDUCATOR
// ==============================

app.get("/institutions/educator/:username", (req, res) => {

    const username = req.params.username;

    db.query(

        "SELECT * FROM institutions WHERE educatorUsername=? LIMIT 1",

        [username],

        (err, result) => {

            if (err) {

                return res.json({
                    success: false,
                    message: err.message
                });

            }

            if (result.length == 0) {

                return res.json({
                    success: false,
                    message: "Institution tidak ditemukan"
                });

            }

            const institution = {

                ...result[0],
            
                isActive: result[0].isActive == 1
            
            };
            
            res.json({
            
                success: true,
            
                data: institution
            
            });

        }

    );

});

// ==============================
// GET INSTITUTION BY NRP CODE
// ==============================

app.get("/institutions/code/:code", (req, res) => {

    const code = req.params.code;

    db.query(

        "SELECT * FROM institutions WHERE nrpCode=? LIMIT 1",

        [code],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.length == 0) {

                return res.json({

                    success: false,
                    message: "Institution tidak ditemukan"

                });

            }
            const institution = {

                ...result[0],
            
                isActive: result[0].isActive == 1
            
            };
            
            res.json({
            
                success:true,
            
                data: institution
            
            });

        }

    );

});



// ==============================
// CREATE REPORT
// ==============================

app.post("/reports", (req, res) => {

    const {

        reporterUserId,
        isAnonymous,
        reporterName,
        victimName,
        perpetratorName,
        perpetratorNrp,
        institutionName,
        location,
        date,
        description,
        evidencePaths,
        isValid,
        severityLevel,
        recommendation,
        aiReason,
        status,
        adminNotes,
        spLevel,
        spPdfPath,
        groupId,
        timestamp

    } = req.body;

    let finalGroupId = "";

    db.query(

        `
        SELECT *
        FROM reports
    
        WHERE perpetratorNrp=?
    
        AND timestamp>=?
    
        ORDER BY timestamp DESC
    
        LIMIT 1
        `,
    
        [
    
            perpetratorNrp,
    
            timestamp - (24 * 60 * 60 * 1000)
    
        ],
    
        (err,recentResult)=>{
    
            if(err){
    
                return res.json({
    
                    success:false,
                    message:err.message
    
                });
    
            }
    
            if(recentResult.length>0){

                finalGroupId =
                    recentResult[0].groupId ||
                    `GROUP_${perpetratorNrp}_${timestamp}`;
            
            }else{
            
                finalGroupId =
                    `GROUP_${perpetratorNrp}_${timestamp}`;
            
            }
    
            db.query(

                `
                INSERT INTO reports
                (
                    reporterUserId,
                    isAnonymous,
                    reporterName,
                    victimName,
                    perpetratorName,
                    perpetratorNrp,
                    institutionName,
                    location,
                    date,
                    description,
                    evidencePaths,
                    isValid,
                    severityLevel,
                    recommendation,
                    aiReason,
                    status,
                    adminNotes,
                    spLevel,
                    spPdfPath,
                    groupId,
                    timestamp
                )
            
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            
                `,
            
                [
            
                    reporterUserId,
                    isAnonymous,
                    reporterName,
                    victimName,
                    perpetratorName,
                    perpetratorNrp,
                    institutionName,
                    location,
                    date,
                    description,
                    evidencePaths,
                    isValid,
                    severityLevel,
                    recommendation,
                    aiReason,
                    status,
                    adminNotes,
                    spLevel,
                    spPdfPath,
                    finalGroupId,
                    timestamp
            
                ],
            
                (err,result)=>{
            
                    if(err){
            
                        return res.json({
            
                            success:false,
                            message:err.message
            
                        });
            
                    }
            
                    db.query(

                        `
                        SELECT *
                        FROM offenders
                        WHERE nrp=?
                        LIMIT 1
                        `,
                    
                        [
                    
                            perpetratorNrp
                    
                        ],
                    
                        (err,offenderResult)=>{
                    
                            if(err){
                    
                                return res.json({
                    
                                    success:false,
                                    message:err.message
                    
                                });
                    
                            }
                    
                            if(offenderResult.length==0){

                                db.query(
                            
                                    `
                                    INSERT INTO offenders
                                    (
                            
                                        name,
                                        nrp,
                                        institutionName,
                                        reportCount,
                                        isHighRisk,
                                        lastReportTimestamp
                            
                                    )
                            
                                    VALUES(?,?,?,?,?,?)
                            
                                    `,
                            
                                    [
                            
                                        perpetratorName,
                                        perpetratorNrp,
                                        institutionName,
                                        1,
                                        false,
                                        Date.now()
                            
                                    ],
                            
                                    (err)=>{
                            
                                        if(err){
                            
                                            return res.json({
                            
                                                success:false,
                                                message:err.message
                            
                                            });
                            
                                        }
                            
                                        return res.json({
                            
                                            success:true,
                                            message:"Laporan berhasil dikirim.",
                                            reportId:result.insertId
                            
                                        });
                            
                                    }
                            
                                );
                            
                            }
                            else{

                                const offender = offenderResult[0];

                                const reportCount = Number(offender.reportCount) + 1;

                                const isHighRisk = reportCount >= 3;
                            
                                db.query(
                            
                                    `
                                    UPDATE offenders
                            
                                    SET
                            
                                        reportCount=?,
                                        isHighRisk=?,
                                        lastReportTimestamp=?
                            
                                    WHERE id=?
                            
                                    `,
                            
                                    [
                            
                                        reportCount,
                                        isHighRisk,
                                        timestamp,
                                        offender.id
                            
                                    ],
                            
                                    (err)=>{
                            
                                        if(err){
                            
                                            return res.json({
                            
                                                success:false,
                                                message:err.message
                            
                                            });
                            
                                        }
                            
                                        return res.json({
                            
                                            success:true,
                                            message:"Laporan berhasil dikirim.",
                                            reportId:result.insertId
                            
                                        });
                            
                                    }
                            
                                );
                            
                            }
                    
                        }
                    
                    );
            
                }
            
            );
    
        }
    
    );

});

// ==============================
// GET ALL REPORTS
// ==============================

// ==============================
// GET ALL REPORTS
// ==============================

app.get("/reports", (req, res) => {

    db.query(

        `
        SELECT *
        FROM reports
        ORDER BY timestamp DESC
        `,

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(report => ({

                ...report,

                isAnonymous: report.isAnonymous == 1,

                isValid: report.isValid == 1

            }));

            res.json({

                success: true,

                data

            });

        }

    );

});





// ==============================
// GET REPORT BY USER
// ==============================

app.get("/reports/user/:userId", (req, res) => {

    const userId = req.params.userId;

    db.query(

        `
        SELECT *
        FROM reports
        WHERE reporterUserId = ?
        ORDER BY timestamp DESC
        `,

        [userId],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(report => ({

                ...report,

                isAnonymous: report.isAnonymous == 1,

                isValid: report.isValid == 1

            }));

            res.json({

                success: true,

                data

            });

        }

    );

});

// ==============================
// GET REPORT BY INSTITUTION
// ==============================

app.get("/reports/institution/:institutionName", (req, res) => {

    const institutionName = req.params.institutionName;

    db.query(

        `
        SELECT *
        FROM reports
        WHERE institutionName = ?
        ORDER BY timestamp DESC
        `,

        [institutionName],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(report => ({

                ...report,

                isAnonymous: report.isAnonymous == 1,

                isValid: report.isValid == 1

            }));

            res.json({

                success: true,

                data

            });

        }

    );

});

app.get("/reports/:id", (req, res) => {

    const id = req.params.id;

    db.query(

        `
        SELECT *
        FROM reports
        WHERE id = ?
        LIMIT 1
        `,

        [id],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.length === 0) {

                return res.json({

                    success: false,
                    message: "Report tidak ditemukan."

                });

            }

            const report = {

                ...result[0],
            
                isAnonymous: result[0].isAnonymous == 1,
            
                isValid: result[0].isValid == 1
            
            };
            
            res.json({
            
                success: true,
            
                data: report
            
            });

        }

    );

});

app.get("/offenders", (req, res) => {

    db.query(

        `
        SELECT *
        FROM offenders

        ORDER BY

            reportCount DESC,
            lastReportTimestamp DESC
        `,

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(item => ({

                ...item,
            
                isHighRisk: item.isHighRisk == 1
            
            }));
            
            res.json({
            
                success:true,
            
                data
            
            });

        }

    );

});

app.get("/offenders/highrisk", (req, res) => {

    db.query(

        `
        SELECT *
        FROM offenders

        WHERE isHighRisk = true

        ORDER BY reportCount DESC
        `,

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            const data = result.map(item => ({

                ...item,
            
                isHighRisk: item.isHighRisk == 1
            
            }));
            
            res.json({
            
                success:true,
            
                data
            
            });
        }

    );

});

// ==============================
// UPDATE REPORT
// ==============================

app.put("/reports/:id",(req,res)=>{

    const id = req.params.id;

    const {

        status,
        adminNotes,
        spLevel,
        spPdfPath

    } = req.body;

    db.query(

        `
        UPDATE reports

        SET

        status=?,
        adminNotes=?,
        spLevel=?,
        spPdfPath=?

        WHERE id=?
        `,

        [

            status,
            adminNotes,
            spLevel,
            spPdfPath,
            id

        ],

        (err)=>{

            if(err){

                return res.json({

                    success:false,
                    message:err.message

                });

            }

            res.json({

                success:true,
                message:"Report berhasil diperbarui."

            });

        }

    );

});

app.put("/reports/:id/status", (req, res) => {

    const id = req.params.id;

    const {

        status

    } = req.body;

    db.query(

        `
        UPDATE reports
        SET status = ?
        WHERE id = ?
        `,

        [

            status,
            id

        ],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.affectedRows === 0) {

                return res.json({

                    success: false,
                    message: "Report tidak ditemukan."

                });

            }

            res.json({

                success: true,
                message: "Status laporan berhasil diperbarui."

            });

        }

    );

});

app.put("/reports/:id/sp", (req, res) => {

    const id = req.params.id;

    const {

        spLevel,
        spPdfPath

    } = req.body;

    db.query(

        `
        UPDATE reports

        SET

            spLevel=?,
            spPdfPath=?

        WHERE id=?

        `,

        [

            spLevel,
            spPdfPath,
            id

        ],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.affectedRows === 0) {

                return res.json({

                    success: false,
                    message: "Report tidak ditemukan."

                });

            }

            res.json({

                success: true,
                message: "Data SP berhasil disimpan."

            });

        }

    );

});

app.put("/reports/:id/finish", (req, res) => {

    const id = req.params.id;

    const {

        status

    } = req.body;

    db.query(

        `
        UPDATE reports

        SET status = ?

        WHERE id = ?
        `,

        [

            status,
            id

        ],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.affectedRows === 0) {

                return res.json({

                    success: false,
                    message: "Report tidak ditemukan."

                });

            }

            res.json({

                success: true,
                message: "Laporan berhasil diselesaikan."

            });

        }

    );

});

app.put("/institutions/:id/approve", (req, res) => {

    const id = req.params.id;

    db.query(

        `
        SELECT *
        FROM institutions
        WHERE id=?
        LIMIT 1
        `,

        [id],

        (err, result) => {

            if (err) {

                return res.json({

                    success:false,
                    message:err.message

                });

            }

            if(result.length==0){

                return res.json({

                    success:false,
                    message:"Institution tidak ditemukan."

                });

            }

            const inst = result[0];

            db.query(

                `
                UPDATE institutions

                SET

                    status='APPROVED',
                    isActive=true

                WHERE id=?
                `,

                [id],

                (err)=>{

                    if(err){

                        return res.json({

                            success:false,
                            message:err.message

                        });

                    }

                    db.query(

                        `
                        INSERT INTO users
                        (

                            username,
                            password,
                            fullName,
                            nrp,
                            role,
                            institutionName,
                            isActive

                        )

                        VALUES(?,?,?,?,?,?,?)

                        `,

                        [

                            inst.educatorUsername,
                            inst.educatorPassword,
                            inst.institutionName,
                            inst.nrpCode,
                            "admin",
                            inst.institutionName,
                            true

                        ],

                        (err)=>{

                            if(err){

                                return res.json({

                                    success:false,
                                    message:err.message

                                });

                            }

                            res.json({

                                success:true,
                                message:"Institution berhasil disetujui."

                            });

                        }

                    );

                }

            );

        }

    );

});

app.put("/users/:id/password", (req, res) => {

    const id = req.params.id;

    const {

        password

    } = req.body;

    db.query(

        `
        UPDATE users

        SET password=?

        WHERE id=?
        `,

        [

            password,
            id

        ],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.affectedRows === 0) {

                return res.json({

                    success: false,
                    message: "User tidak ditemukan."

                });

            }

            res.json({

                success: true,
                message: "Password berhasil diubah."

            });

        }

    );

});

app.put("/users/:id/active", (req, res) => {

    const id = req.params.id;

    const {

        isActive

    } = req.body;

    db.query(

        `
        UPDATE users

        SET isActive=?

        WHERE id=?
        `,

        [

            isActive,
            id

        ],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.affectedRows === 0) {

                return res.json({

                    success: false,
                    message: "User tidak ditemukan."

                });

            }

            res.json({

                success: true,
                message: "Status akun berhasil diperbarui."

            });

        }

    );

});
// ==============================
// DELETE REPORT
// ==============================

app.delete("/reports/:id",(req,res)=>{

    const id = req.params.id;

    db.query(

        "DELETE FROM reports WHERE id=?",

        [id],

        (err)=>{

            if(err){

                return res.json({

                    success:false,
                    message:err.message

                });

            }

            res.json({

                success:true,
                message:"Report berhasil dihapus."

            });

        }

    );

});

app.delete("/institutions/:id", (req, res) => {

    const id = req.params.id;

    db.query(

        `
        DELETE FROM institutions
        WHERE id=?
        `,

        [id],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.affectedRows === 0) {

                return res.json({

                    success: false,
                    message: "Institution tidak ditemukan."

                });

            }

            res.json({

                success: true,
                message: "Registrasi institution berhasil ditolak."

            });

        }

    );

});

app.delete("/users/:id", (req, res) => {

    const id = req.params.id;

    db.query(

        `
        SELECT *
        FROM users
        WHERE id=?
        LIMIT 1
        `,

        [id],

        (err, result) => {

            if (err) {

                return res.json({

                    success: false,
                    message: err.message

                });

            }

            if (result.length === 0) {

                return res.json({

                    success: false,
                    message: "User tidak ditemukan."

                });

            }

            const user = result[0];

            db.query(

                `
                DELETE FROM users
                WHERE id=?
                `,

                [id],

                (err) => {

                    if (err) {

                        return res.json({

                            success: false,
                            message: err.message

                        });

                    }

                    db.query(

                        `
                        DELETE FROM institutions
                        WHERE educatorUsername=?
                        `,

                        [

                            user.username

                        ],

                        (err) => {

                            if (err) {

                                return res.json({

                                    success: false,
                                    message: err.message

                                });

                            }

                            res.json({

                                success: true,
                                message: "Akun educator berhasil dihapus."

                            });

                        }

                    );

                }

            );

        }

    );

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{

    console.log("Server Running");
    console.log("http://localhost:3000");

});

