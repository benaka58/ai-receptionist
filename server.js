"use strict";

/*
 * ============================================================
 * AI RECEPTIONIST - MAIN SERVER
 * ============================================================
 *
 * This server handles:
 *   - Frontend files
 *   - API status
 *   - Visitors
 *   - Appointments
 *   - Dashboard statistics
 *   - CORS
 *   - JSON requests
 *
 * Database:
 *   database.js
 *
 * Run:
 *   node server.js
 *
 * Check syntax:
 *   node --check server.js
 *
 * Start:
 *   node server.js
 * ============================================================
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./database");

const app = express();

const PORT = process.env.PORT || 3000;

/* ============================================================
   MIDDLEWARE
   ============================================================ */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ============================================================
   BASIC REQUEST LOGGER
   ============================================================ */

app.use((req, res, next) => {
    console.log(
        `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );

    next();
});

/* ============================================================
   HEALTH / STATUS
   ============================================================ */

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "AI Receptionist server is running",
        server: "server.js",
        status: "online",
        port: PORT,
        time: new Date().toISOString()
    });
});

/* ============================================================
   ROOT API
   ============================================================ */

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to AI Receptionist API",
        endpoints: {
            status: "GET /api/status",

            visitors: {
                get: "GET /api/visitors",
                create: "POST /api/visitors",
                delete: "DELETE /api/visitors/:id"
            },

            appointments: {
                get: "GET /api/appointments",
                create: "POST /api/appointments",
                delete: "DELETE /api/appointments/:id"
            },

            dashboard: "GET /api/dashboard"
        }
    });
});

/* ============================================================
   VISITORS
   ============================================================ */

/*
 * GET ALL VISITORS
 */

app.get("/api/visitors", (req, res) => {
    try {
        const visitors = db
            .prepare(`
                SELECT
                    id,
                    name,
                    phone,
                    purpose,
                    person,
                    created_at
                FROM visitors
                ORDER BY id DESC
            `)
            .all();

        res.json({
            success: true,
            count: visitors.length,
            visitors: visitors
        });
    } catch (error) {
        console.error("GET /api/visitors error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch visitors",
            error: error.message
        });
    }
});

/*
 * CREATE VISITOR
 */

app.post("/api/visitors", (req, res) => {
    try {
        const {
            name,
            phone,
            purpose,
            person
        } = req.body;

        if (!name || String(name).trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Visitor name is required"
            });
        }

        const cleanName = String(name).trim();
        const cleanPhone =
            phone !== undefined && phone !== null
                ? String(phone).trim()
                : null;

        const cleanPurpose =
            purpose !== undefined && purpose !== null
                ? String(purpose).trim()
                : null;

        const cleanPerson =
            person !== undefined && person !== null
                ? String(person).trim()
                : null;

        const statement = db.prepare(`
            INSERT INTO visitors (
                name,
                phone,
                purpose,
                person
            )
            VALUES (?, ?, ?, ?)
        `);

        const result = statement.run(
            cleanName,
            cleanPhone,
            cleanPurpose,
            cleanPerson
        );

        const visitor = db
            .prepare(`
                SELECT
                    id,
                    name,
                    phone,
                    purpose,
                    person,
                    created_at
                FROM visitors
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: "Visitor registered successfully",
            visitor: visitor
        });
    } catch (error) {
        console.error("POST /api/visitors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to register visitor",
            error: error.message
        });
    }
});

/*
 * DELETE VISITOR
 */

app.delete("/api/visitors/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid visitor ID"
            });
        }

        const result = db
            .prepare("DELETE FROM visitors WHERE id = ?")
            .run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found"
            });
        }

        return res.json({
            success: true,
            message: "Visitor deleted successfully"
        });
    } catch (error) {
        console.error("DELETE /api/visitors error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete visitor",
            error: error.message
        });
    }
});

/* ============================================================
   APPOINTMENTS
   ============================================================ */

/*
 * GET ALL APPOINTMENTS
 */

app.get("/api/appointments", (req, res) => {
    try {
        const appointments = db
            .prepare(`
                SELECT
                    id,
                    name,
                    phone,
                    person,
                    date,
                    time,
                    purpose,
                    created_at
                FROM appointments
                ORDER BY date ASC, time ASC, id DESC
            `)
            .all();

        res.json({
            success: true,
            count: appointments.length,
            appointments: appointments
        });
    } catch (error) {
        console.error("GET /api/appointments error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch appointments",
            error: error.message
        });
    }
});

/*
 * CREATE APPOINTMENT
 */

app.post("/api/appointments", (req, res) => {
    try {
        const {
            name,
            phone,
            person,
            date,
            time,
            purpose
        } = req.body;

        if (!name || String(name).trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Appointment name is required"
            });
        }

        if (!date || String(date).trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Appointment date is required"
            });
        }

        if (!time || String(time).trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Appointment time is required"
            });
        }

        const cleanName = String(name).trim();

        const cleanPhone =
            phone !== undefined && phone !== null
                ? String(phone).trim()
                : null;

        const cleanPerson =
            person !== undefined && person !== null
                ? String(person).trim()
                : null;

        const cleanDate = String(date).trim();
        const cleanTime = String(time).trim();

        const cleanPurpose =
            purpose !== undefined && purpose !== null
                ? String(purpose).trim()
                : null;

        const statement = db.prepare(`
            INSERT INTO appointments (
                name,
                phone,
                person,
                date,
                time,
                purpose
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = statement.run(
            cleanName,
            cleanPhone,
            cleanPerson,
            cleanDate,
            cleanTime,
            cleanPurpose
        );

        const appointment = db
            .prepare(`
                SELECT
                    id,
                    name,
                    phone,
                    person,
                    date,
                    time,
                    purpose,
                    created_at
                FROM appointments
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            appointment: appointment
        });
    } catch (error) {
        console.error("POST /api/appointments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create appointment",
            error: error.message
        });
    }
});

/*
 * DELETE APPOINTMENT
 */

app.delete("/api/appointments/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            });
        }

        const result = db
            .prepare("DELETE FROM appointments WHERE id = ?")
            .run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        return res.json({
            success: true,
            message: "Appointment deleted successfully"
        });
    } catch (error) {
        console.error("DELETE /api/appointments error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete appointment",
            error: error.message
        });
    }
});

/* ============================================================
   DASHBOARD STATISTICS
   ============================================================ */

app.get("/api/dashboard", (req, res) => {
    try {
        const visitorCount = db
            .prepare(`
                SELECT COUNT(*) AS count
                FROM visitors
            `)
            .get();

        const appointmentCount = db
            .prepare(`
                SELECT COUNT(*) AS count
                FROM appointments
            `)
            .get();

        const today = new Date().toISOString().slice(0, 10);

        const todayAppointments = db
            .prepare(`
                SELECT COUNT(*) AS count
                FROM appointments
                WHERE date = ?
            `)
            .get(today);

        const todayVisitors = db
            .prepare(`
                SELECT COUNT(*) AS count
                FROM visitors
                WHERE DATE(created_at) = DATE('now')
            `)
            .get();

        res.json({
            success: true,
            dashboard: {
                totalVisitors: visitorCount.count,
                totalAppointments: appointmentCount.count,
                todayVisitors: todayVisitors.count,
                todayAppointments: todayAppointments.count
            }
        });
    } catch (error) {
        console.error("GET /api/dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard",
            error: error.message
        });
    }
});

/* ============================================================
   RECENT VISITORS
   ============================================================ */

app.get("/api/visitors/recent", (req, res) => {
    try {
        const visitors = db
            .prepare(`
                SELECT
                    id,
                    name,
                    phone,
                    purpose,
                    person,
                    created_at
                FROM visitors
                ORDER BY id DESC
                LIMIT 10
            `)
            .all();

        res.json({
            success: true,
            visitors: visitors
        });
    } catch (error) {
        console.error(
            "GET /api/visitors/recent error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch recent visitors",
            error: error.message
        });
    }
});

/* ============================================================
   UPCOMING APPOINTMENTS
   ============================================================ */

app.get("/api/appointments/upcoming", (req, res) => {
    try {
        const appointments = db
            .prepare(`
                SELECT
                    id,
                    name,
                    phone,
                    person,
                    date,
                    time,
                    purpose,
                    created_at
                FROM appointments
                WHERE date >= ?
                ORDER BY date ASC, time ASC
                LIMIT 10
            `)
            .all(
                new Date().toISOString().slice(0, 10)
            );

        res.json({
            success: true,
            appointments: appointments
        });
    } catch (error) {
        console.error(
            "GET /api/appointments/upcoming error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch upcoming appointments",
            error: error.message
        });
    }
});

/* ============================================================
   FRONTEND STATIC FILES
   ============================================================ */

app.use(
    express.static(__dirname, {
        extensions: ["html"]
    })
);

/* ============================================================
   FRONTEND FALLBACK
   ============================================================ */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

/* ============================================================
   404 HANDLER
   ============================================================ */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint or page not found",
        path: req.originalUrl
    });
});

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message
    });
});

/* ============================================================
   START SERVER
   ============================================================ */

const server = app.listen(PORT, () => {
    console.log("");
    console.log("================================================");
    console.log("       AI RECEPTIONIST SERVER");
    console.log("================================================");
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`API:   http://localhost:${PORT}/api`);
    console.log(
        `Status: http://localhost:${PORT}/api/status`
    );
    console.log("================================================");
    console.log("");
});

/* ============================================================
   SERVER ERROR HANDLING
   ============================================================ */

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(
            `Port ${PORT} is already in use.`
        );
        console.error(
            "Stop the other server or use another PORT."
        );
    } else {
        console.error(
            "Server startup error:",
            error
        );
    }
});

/* ============================================================
   GRACEFUL SHUTDOWN
   ============================================================ */

function shutdown(signal) {
    console.log(`\n${signal} received.`);

    server.close(() => {
        console.log("HTTP server stopped.");

        try {
            if (db && typeof db.close === "function") {
                db.close();
                console.log("Database connection closed.");
            }
        } catch (error) {
            console.error(
                "Error closing database:",
                error.message
            );
        }

        process.exit(0);
    });
}

process.on("SIGINT", () => {
    shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    shutdown("SIGTERM");
});