"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

/* ============================================================
   ADMIN LOGIN CREDENTIALS
   ============================================================ */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

/* ============================================================
   MIDDLEWARE
   ============================================================ */

app.disable("x-powered-by");

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(express.static(__dirname));

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function clean(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function getId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

function errorResponse(res, message, error) {
    console.error(message, error);

    return res.status(500).json({
        success: false,
        message: message
    });
}

/* ============================================================
   HOME PAGE
   ============================================================ */

app.get("/", function (req, res) {
    const file = path.join(__dirname, "index.html");

    res.sendFile(file, function (error) {
        if (error) {
            console.error("Unable to load index.html:", error);

            return res.status(500).send(
                "<h1>AI Receptionist</h1>" +
                "<p>Server is running, but index.html could not be loaded.</p>"
            );
        }
    });
});

/* ============================================================
   ADMIN LOGIN PAGE
   ============================================================ */

app.get("/login", function (req, res) {
    const file = path.join(__dirname, "login.html");

    res.sendFile(file, function (error) {
        if (error) {
            console.error("Unable to load login.html:", error);

            return res.status(500).send(
                "<h1>Admin Login</h1>" +
                "<p>login.html could not be loaded.</p>"
            );
        }
    });
});

/* ============================================================
   ADMIN LOGIN HTML ALIAS
   ============================================================ */

app.get("/login.html", function (req, res) {
    const file = path.join(__dirname, "login.html");

    res.sendFile(file, function (error) {
        if (error) {
            console.error("Unable to load login.html:", error);

            return res.status(500).send(
                "<h1>Admin Login</h1>" +
                "<p>login.html could not be loaded.</p>"
            );
        }
    });
});

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

app.get("/admin", function (req, res) {
    const file = path.join(__dirname, "admin.html");

    res.sendFile(file, function (error) {
        if (error) {
            console.error("Unable to load admin.html:", error);

            return res.status(500).send(
                "<h1>Admin Dashboard</h1>" +
                "<p>admin.html could not be loaded.</p>"
            );
        }
    });
});

/* ============================================================
   ADMIN DASHBOARD HTML ALIAS
   ============================================================ */

app.get("/admin.html", function (req, res) {
    const file = path.join(__dirname, "admin.html");

    res.sendFile(file, function (error) {
        if (error) {
            console.error("Unable to load admin.html:", error);

            return res.status(500).send(
                "<h1>Admin Dashboard</h1>" +
                "<p>admin.html could not be loaded.</p>"
            );
        }
    });
});

/* ============================================================
   ADMIN LOGIN API
   ============================================================ */

app.post("/api/login", function (req, res) {
    try {
        const username = clean(req.body.username);
        const password = clean(req.body.password);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "Username and password are required."
            });
        }

        if (
            username !== ADMIN_USERNAME ||
            password !== ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                error: "Invalid username or password."
            });
        }

        return res.json({
            success: true,
            message: "Login successful.",
            username: username
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to process login.",
            error
        );
    }
});

/* ============================================================
   HEALTH CHECK
   ============================================================ */

app.get("/api/health", function (req, res) {
    try {
        db.prepare("SELECT 1").get();

        return res.json({
            success: true,
            message: "AI Receptionist server is running.",
            server: "server2.js",
            database: "connected",
            time: new Date().toISOString()
        });
    } catch (error) {
        return errorResponse(
            res,
            "Database connection failed.",
            error
        );
    }
});

/* ============================================================
   SERVER STATUS
   ============================================================ */

app.get("/api/status", function (req, res) {
    try {
        const visitors = db
            .prepare(
                "SELECT COUNT(*) AS count FROM visitors"
            )
            .get().count;

        const appointments = db
            .prepare(
                "SELECT COUNT(*) AS count FROM appointments"
            )
            .get().count;

        return res.json({
            success: true,
            status: "online",
            visitors: visitors,
            appointments: appointments,
            time: new Date().toISOString()
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to read server status.",
            error
        );
    }
});

/* ============================================================
   DASHBOARD STATISTICS
   ============================================================ */

app.get("/api/stats", function (req, res) {
    try {
        const totalVisitors = db
            .prepare(
                "SELECT COUNT(*) AS count FROM visitors"
            )
            .get().count;

        const totalAppointments = db
            .prepare(
                "SELECT COUNT(*) AS count FROM appointments"
            )
            .get().count;

        const today = new Date()
            .toISOString()
            .slice(0, 10);

        const todayAppointments = db
            .prepare(
                "SELECT COUNT(*) AS count " +
                "FROM appointments WHERE date = ?"
            )
            .get(today).count;

        return res.json({
            success: true,
            totalVisitors: totalVisitors,
            totalAppointments: totalAppointments,
            todayAppointments: todayAppointments,

            visitors: totalVisitors,
            appointments: totalAppointments,
            today: todayAppointments
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to load statistics.",
            error
        );
    }
});

/* ============================================================
   VISITORS
   ============================================================ */

/* GET ALL VISITORS */

app.get("/api/visitors", function (req, res) {
    try {
        const search = clean(req.query.search);

        let visitors;

        if (search) {
            const term = "%" + search + "%";

            visitors = db
                .prepare(
                    "SELECT id, name, phone, purpose, person, " +
                    "created_at FROM visitors " +
                    "WHERE name LIKE ? " +
                    "OR phone LIKE ? " +
                    "OR purpose LIKE ? " +
                    "OR person LIKE ? " +
                    "ORDER BY id DESC"
                )
                .all(
                    term,
                    term,
                    term,
                    term
                );
        } else {
            visitors = db
                .prepare(
                    "SELECT id, name, phone, purpose, person, " +
                    "created_at FROM visitors " +
                    "ORDER BY id DESC"
                )
                .all();
        }

        return res.json({
            success: true,
            visitors: visitors
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to load visitors.",
            error
        );
    }
});

/* GET ONE VISITOR */

app.get("/api/visitors/:id", function (req, res) {
    try {
        const id = getId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid visitor ID."
            });
        }

        const visitor = db
            .prepare(
                "SELECT id, name, phone, purpose, person, " +
                "created_at FROM visitors WHERE id = ?"
            )
            .get(id);

        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found."
            });
        }

        return res.json({
            success: true,
            visitor: visitor
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to load visitor.",
            error
        );
    }
});

/* CREATE VISITOR */

app.post("/api/visitors", function (req, res) {
    try {
        const name = clean(req.body.name);
        const phone = clean(req.body.phone);
        const purpose = clean(req.body.purpose);
        const person = clean(req.body.person);

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Visitor name is required."
            });
        }

        const result = db
            .prepare(
                "INSERT INTO visitors " +
                "(name, phone, purpose, person) " +
                "VALUES (?, ?, ?, ?)"
            )
            .run(
                name,
                phone || null,
                purpose || null,
                person || null
            );

        const visitor = db
            .prepare(
                "SELECT id, name, phone, purpose, person, " +
                "created_at FROM visitors WHERE id = ?"
            )
            .get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: "Visitor registered successfully.",
            visitor: visitor
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to register visitor.",
            error
        );
    }
});

/* UPDATE VISITOR */

app.put("/api/visitors/:id", function (req, res) {
    try {
        const id = getId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid visitor ID."
            });
        }

        const existing = db
            .prepare(
                "SELECT id FROM visitors WHERE id = ?"
            )
            .get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found."
            });
        }

        const name = clean(req.body.name);
        const phone = clean(req.body.phone);
        const purpose = clean(req.body.purpose);
        const person = clean(req.body.person);

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Visitor name is required."
            });
        }

        db.prepare(
            "UPDATE visitors SET " +
            "name = ?, phone = ?, purpose = ?, person = ? " +
            "WHERE id = ?"
        ).run(
            name,
            phone || null,
            purpose || null,
            person || null,
            id
        );

        const visitor = db
            .prepare(
                "SELECT id, name, phone, purpose, person, " +
                "created_at FROM visitors WHERE id = ?"
            )
            .get(id);

        return res.json({
            success: true,
            message: "Visitor updated successfully.",
            visitor: visitor
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to update visitor.",
            error
        );
    }
});

/* DELETE VISITOR */

app.delete("/api/visitors/:id", function (req, res) {
    try {
        const id = getId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid visitor ID."
            });
        }

        const result = db
            .prepare(
                "DELETE FROM visitors WHERE id = ?"
            )
            .run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Visitor not found."
            });
        }

        return res.json({
            success: true,
            message: "Visitor deleted successfully."
        });
    } catch (error) {
        return errorResponse(
            res,
            "Unable to delete visitor.",
            error
        );
    }
});

/* ============================================================
   APPOINTMENTS
   ============================================================ */

/* GET ALL APPOINTMENTS */

app.get("/api/appointments", function (req, res) {
    try {
        const search = clean(req.query.search);

        let appointments;

        if (search) {
            const term = "%" + search + "%";

            appointments = db
                .prepare(
                    "SELECT id, name, phone, person, date, time, " +
                    "purpose, created_at FROM appointments " +
                    "WHERE name LIKE ? " +
                    "OR phone LIKE ? " +
                    "OR person LIKE ? " +
                    "OR date LIKE ? " +
                    "OR time LIKE ? " +
                    "OR purpose LIKE ? " +
                    "ORDER BY date ASC, time ASC, id DESC"
                )
                .all(
                    term,
                    term,
                    term,
                    term,
                    term,
                    term
                );
        } else {
            appointments = db
                .prepare(
                    "SELECT id, name, phone, person, date, time, " +
                    "purpose, created_at FROM appointments " +
                    "ORDER BY date ASC, time ASC, id DESC"
                )
                .all();
                }

        return res.json({
            success: true,
            appointments: appointments
        });

    } catch (error) {
        return errorResponse(
            res,
            "Unable to load appointments.",
            error
        );
    }
});


/* ============================================================
   GET ONE APPOINTMENT
   ============================================================ */

app.get("/api/appointments/:id", function (req, res) {
    try {
        const id = getId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID."
            });
        }

        const appointment = db
            .prepare(
                "SELECT id, name, phone, person, date, time, " +
                "purpose, created_at FROM appointments WHERE id = ?"
            )
            .get(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        return res.json({
            success: true,
            appointment: appointment
        });

    } catch (error) {
        return errorResponse(
            res,
            "Unable to load appointment.",
            error
        );
    }
});


/* ============================================================
   CREATE APPOINTMENT
   ============================================================ */

app.post("/api/appointments", function (req, res) {
    try {
        const name = clean(req.body.name);
        const phone = clean(req.body.phone);
        const person = clean(req.body.person);
        const date = clean(req.body.date);
        const time = clean(req.body.time);
        const purpose = clean(req.body.purpose);

        if (!name || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Name, date and time are required."
            });
        }

        const result = db
            .prepare(
                "INSERT INTO appointments " +
                "(name, phone, person, date, time, purpose) " +
                "VALUES (?, ?, ?, ?, ?, ?)"
            )
            .run(
                name,
                phone || null,
                person || null,
                date,
                time,
                purpose || null
            );

        const appointment = db
            .prepare(
                "SELECT id, name, phone, person, date, time, " +
                "purpose, created_at FROM appointments WHERE id = ?"
            )
            .get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: "Appointment created successfully.",
            appointment: appointment
        });

    } catch (error) {
        return errorResponse(
            res,
            "Unable to create appointment.",
            error
        );
    }
});


/* ============================================================
   UPDATE APPOINTMENT
   ============================================================ */

app.put("/api/appointments/:id", function (req, res) {
    try {
        const id = getId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID."
            });
        }

        const existing = db
            .prepare(
                "SELECT id FROM appointments WHERE id = ?"
            )
            .get(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        const name = clean(req.body.name);
        const phone = clean(req.body.phone);
        const person = clean(req.body.person);
        const date = clean(req.body.date);
        const time = clean(req.body.time);
        const purpose = clean(req.body.purpose);

        if (!name || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Name, date and time are required."
            });
        }

        db.prepare(
            "UPDATE appointments SET " +
            "name = ?, phone = ?, person = ?, date = ?, " +
            "time = ?, purpose = ? WHERE id = ?"
        ).run(
            name,
            phone || null,
            person || null,
            date,
            time,
            purpose || null,
            id
        );

        const appointment = db
            .prepare(
                "SELECT id, name, phone, person, date, time, " +
                "purpose, created_at FROM appointments WHERE id = ?"
            )
            .get(id);

        return res.json({
            success: true,
            message: "Appointment updated successfully.",
            appointment: appointment
        });

    } catch (error) {
        return errorResponse(
            res,
            "Unable to update appointment.",
            error
        );
    }
});


/* ============================================================
   DELETE APPOINTMENT
   ============================================================ */

app.delete("/api/appointments/:id", function (req, res) {
    try {
        const id = getId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment ID."
            });
        }

        const result = db
            .prepare(
                "DELETE FROM appointments WHERE id = ?"
            )
            .run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found."
            });
        }

        return res.json({
            success: true,
            message: "Appointment deleted successfully."
        });

    } catch (error) {
        return errorResponse(
            res,
            "Unable to delete appointment.",
            error
        );
    }
});


/* ============================================================
   GLOBAL SEARCH
   ============================================================ */

app.get("/api/search", function (req, res) {
    try {
        const search = clean(
            req.query.q || req.query.search
        );

        if (!search) {
            return res.json({
                success: true,
                visitors: [],
                appointments: []
            });
        }

        const term = "%" + search + "%";

        const visitors = db
            .prepare(
                "SELECT id, name, phone, purpose, person, " +
                "created_at FROM visitors " +
                "WHERE name LIKE ? " +
                "OR phone LIKE ? " +
                "OR purpose LIKE ? " +
                "OR person LIKE ? " +
                "ORDER BY id DESC"
            )
            .all(
                term,
                term,
                term,
                term
            );

        const appointments = db
            .prepare(
                "SELECT id, name, phone, person, date, time, " +
                "purpose, created_at FROM appointments " +
                "WHERE name LIKE ? " +
                "OR phone LIKE ? " +
                "OR person LIKE ? " +
                "OR date LIKE ? " +
                "OR time LIKE ? " +
                "OR purpose LIKE ? " +
                "ORDER BY id DESC"
            )
            .all(
                term,
                term,
                term,
                term,
                term,
                term
            );

        return res.json({
            success: true,
            visitors: visitors,
            appointments: appointments
        });

    } catch (error) {
        return errorResponse(
            res,
            "Search failed.",
            error
        );
    }
});


/* ============================================================
   404 HANDLER
   ============================================================ */

app.use(function (req, res) {
    return res.status(404).json({
        success: false,
        message: "API endpoint or page not found.",
        path: req.path
    });
});


/* ============================================================
   ERROR HANDLER
   ============================================================ */

app.use(function (error, req, res, next) {
    console.error(
        "Unhandled server error:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});


/* ============================================================
   START SERVER
   ============================================================ */

const server = app.listen(
    PORT,
    HOST,
    function () {

        console.log(
            "============================================================"
        );

        console.log(
            "             AI RECEPTIONIST - SERVER 2"
        );

        console.log(
            "============================================================"
        );

        console.log(
            "Server:     http://localhost:" +
            PORT
        );

        console.log(
            "Login:      http://localhost:" +
            PORT +
            "/login"
        );

        console.log(
            "Admin:      http://localhost:" +
            PORT +
            "/admin"
        );

        console.log(
            "Health:     http://localhost:" +
            PORT +
            "/api/health"
        );

        console.log(
            "Status:     http://localhost:" +
            PORT +
            "/api/status"
        );

        console.log(
            "Statistics: http://localhost:" +
            PORT +
            "/api/stats"
        );

        console.log(
            "Database:   Connected"
        );

        console.log(
            "============================================================"
        );
    }
);


/* ============================================================
   GRACEFUL SHUTDOWN
   ============================================================ */

function shutdown(signal) {

    console.log("");

    console.log(
        signal + " received."
    );

    server.close(function () {

        try {

            db.close();

            console.log(
                "HTTP server stopped."
            );

            console.log(
                "Database connection closed."
            );

        } catch (error) {

            console.error(
                "Shutdown error:",
                error
            );
        }

        process.exit(0);
    });
}


process.on(
    "SIGINT",
    function () {
        shutdown("SIGINT");
    }
);


process.on(
    "SIGTERM",
    function () {
        shutdown("SIGTERM");
    }
);