"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");

const database = require("./database");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

/* ============================================================
   ADMIN LOGIN
   ============================================================ */

const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "admin123";

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

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);

app.use(express.static(__dirname));

/* ============================================================
   HELPERS
   ============================================================ */

function clean(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}

function getId(value) {

    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}

function errorResponse(
    res,
    message,
    error
) {

    console.error(
        message,
        error
    );

    return res.status(500).json({
        success: false,
        message: message
    });
}

/* ============================================================
   HOME
   ============================================================ */

app.get(
    "/",
    function (req, res) {

        const file =
            path.join(
                __dirname,
                "index.html"
            );

        res.sendFile(
            file,
            function (error) {

                if (error) {

                    console.error(
                        "Unable to load index.html:",
                        error
                    );

                    return res.status(500).send(
                        "<h1>AI Receptionist</h1>" +
                        "<p>index.html could not be loaded.</p>"
                    );
                }
            }
        );
    }
);

/* ============================================================
   LOGIN PAGE
   ============================================================ */

app.get(
    "/login",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "login.html"
            )
        );
    }
);

app.get(
    "/login.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "login.html"
            )
        );
    }
);

/* ============================================================
   ADMIN PAGE
   ============================================================ */

app.get(
    "/admin",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );
    }
);

app.get(
    "/admin.html",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );
    }
);

/* ============================================================
   LOGIN API
   ============================================================ */

app.post(
    "/api/login",
    function (req, res) {

        try {

            const username =
                clean(req.body.username);

            const password =
                clean(req.body.password);

            if (
                !username ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Username and password are required."
                });
            }

            if (
                username !==
                    ADMIN_USERNAME ||
                password !==
                    ADMIN_PASSWORD
            ) {

                return res.status(401).json({
                    success: false,
                    error:
                        "Invalid username or password."
                });
            }

            return res.json({
                success: true,
                message:
                    "Login successful.",
                username: username
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to process login.",
                error
            );
        }
    }
);

/* ============================================================
   HEALTH
   ============================================================ */

app.get(
    "/api/health",
    async function (req, res) {

        try {

            await database.testConnection();

            return res.json({
                success: true,
                message:
                    "AI Receptionist server is running.",
                server: "server2.js",
                database: "connected",
                time:
                    new Date().toISOString()
            });

        } catch (error) {

            return errorResponse(
                res,
                "Database connection failed.",
                error
            );
        }
    }
);

/* ============================================================
   STATUS
   ============================================================ */

app.get(
    "/api/status",
    async function (req, res) {

        try {

            const visitorResult =
                await database.get(
                    "SELECT COUNT(*) AS count " +
                    "FROM visitors"
                );

            const appointmentResult =
                await database.get(
                    "SELECT COUNT(*) AS count " +
                    "FROM appointments"
                );

            return res.json({
                success: true,
                status: "online",
                visitors:
                    Number(
                        visitorResult.count
                    ),
                appointments:
                    Number(
                        appointmentResult.count
                    ),
                time:
                    new Date().toISOString()
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to read server status.",
                error
            );
        }
    }
);

/* ============================================================
   STATISTICS
   ============================================================ */

app.get(
    "/api/stats",
    async function (req, res) {

        try {

            const visitorResult =
                await database.get(
                    "SELECT COUNT(*) AS count " +
                    "FROM visitors"
                );

            const appointmentResult =
                await database.get(
                    "SELECT COUNT(*) AS count " +
                    "FROM appointments"
                );

            const today =
                new Date()
                    .toISOString()
                    .slice(0, 10);

            const todayResult =
                await database.get(
                    "SELECT COUNT(*) AS count " +
                    "FROM appointments " +
                    "WHERE date = ?",
                    [today]
                );

            const totalVisitors =
                Number(
                    visitorResult.count
                );

            const totalAppointments =
                Number(
                    appointmentResult.count
                );

            const todayAppointments =
                Number(
                    todayResult.count
                );

            return res.json({
                success: true,

                totalVisitors:
                    totalVisitors,

                totalAppointments:
                    totalAppointments,

                todayAppointments:
                    todayAppointments,

                visitors:
                    totalVisitors,

                appointments:
                    totalAppointments,

                today:
                    todayAppointments
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to load statistics.",
                error
            );
        }
    }
);

/* ============================================================
   GET ALL VISITORS
   ============================================================ */

app.get(
    "/api/visitors",
    async function (req, res) {

        try {

            const search =
                clean(req.query.search);

            let visitors;

            if (search) {

                const term =
                    "%" + search + "%";

                visitors =
                    await database.all(
                        "SELECT id, name, phone, " +
                        "purpose, person, created_at " +
                        "FROM visitors " +
                        "WHERE name LIKE ? " +
                        "OR phone LIKE ? " +
                        "OR purpose LIKE ? " +
                        "OR person LIKE ? " +
                        "ORDER BY id DESC",
                        [
                            term,
                            term,
                            term,
                            term
                        ]
                    );

            } else {

                visitors =
                    await database.all(
                        "SELECT id, name, phone, " +
                        "purpose, person, created_at " +
                        "FROM visitors " +
                        "ORDER BY id DESC"
                    );
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
    }
);

/* ============================================================
   GET ONE VISITOR
   ============================================================ */

app.get(
    "/api/visitors/:id",
    async function (req, res) {

        try {

            const id =
                getId(req.params.id);

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid visitor ID."
                });
            }

            const visitor =
                await database.get(
                    "SELECT id, name, phone, " +
                    "purpose, person, created_at " +
                    "FROM visitors " +
                    "WHERE id = ?",
                    [id]
                );

            if (!visitor) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Visitor not found."
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
    }
);

/* ============================================================
   CREATE VISITOR
   ============================================================ */

app.post(
    "/api/visitors",
    async function (req, res) {

        try {

            const name =
                clean(req.body.name);

            const phone =
                clean(req.body.phone);

            const purpose =
                clean(req.body.purpose);

            const person =
                clean(req.body.person);

            if (!name) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Visitor name is required."
                });
            }

            const result =
                await database.run(
                    "INSERT INTO visitors " +
                    "(name, phone, purpose, person) " +
                    "VALUES (?, ?, ?, ?)",
                    [
                        name,
                        phone || null,
                        purpose || null,
                        person || null
                    ]
                );

            const visitor =
                await database.get(
                    "SELECT id, name, phone, " +
                    "purpose, person, created_at " +
                    "FROM visitors " +
                    "WHERE id = ?",
                    [
                        result.lastInsertRowid
                    ]
                );

            return res.status(201).json({
                success: true,
                message:
                    "Visitor registered successfully.",
                visitor: visitor
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to register visitor.",
                error
            );
        }
    }
);

/* ============================================================
   UPDATE VISITOR
   ============================================================ */

app.put(
    "/api/visitors/:id",
    async function (req, res) {

        try {

            const id =
                getId(req.params.id);

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid visitor ID."
                });
            }

            const existing =
                await database.get(
                    "SELECT id FROM visitors " +
                    "WHERE id = ?",
                    [id]
                );

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Visitor not found."
                });
            }

            const name =
                clean(req.body.name);

            const phone =
                clean(req.body.phone);

            const purpose =
                clean(req.body.purpose);

            const person =
                clean(req.body.person);

            if (!name) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Visitor name is required."
                });
            }

            await database.run(
                "UPDATE visitors SET " +
                "name = ?, phone = ?, " +
                "purpose = ?, person = ? " +
                "WHERE id = ?",
                [
                    name,
                    phone || null,
                    purpose || null,
                    person || null,
                    id
                ]
            );

            const visitor =
                await database.get(
                    "SELECT id, name, phone, " +
                    "purpose, person, created_at " +
                    "FROM visitors WHERE id = ?",
                    [id]
                );

            return res.json({
                success: true,
                message:
                    "Visitor updated successfully.",
                visitor: visitor
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to update visitor.",
                error
            );
        }
    }
);

/* ============================================================
   DELETE VISITOR
   ============================================================ */

app.delete(
    "/api/visitors/:id",
    async function (req, res) {

        try {

            const id =
                getId(req.params.id);

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid visitor ID."
                });
            }

            const result =
                await database.run(
                    "DELETE FROM visitors " +
                    "WHERE id = ?",
                    [id]
                );

            if (
                result.changes === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Visitor not found."
                });
            }

            return res.json({
                success: true,
                message:
                    "Visitor deleted successfully."
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to delete visitor.",
                error
            );
        }
    }
);

/* ============================================================
   GET ALL APPOINTMENTS
   ============================================================ */

app.get(
    "/api/appointments",
    async function (req, res) {

        try {

            const search =
                clean(req.query.search);

            let appointments;

            if (search) {

                const term =
                    "%" + search + "%";

                appointments =
                    await database.all(
                        "SELECT id, name, phone, " +
                        "person, date, time, purpose, " +
                        "created_at " +
                        "FROM appointments " +
                        "WHERE name LIKE ? " +
                        "OR phone LIKE ? " +
                        "OR person LIKE ? " +
                        "OR date LIKE ? " +
                        "OR time LIKE ? " +
                        "OR purpose LIKE ? " +
                        "ORDER BY date ASC, " +
                        "time ASC, id DESC",
                        [
                            term,
                            term,
                            term,
                            term,
                            term,
                            term
                        ]
                    );

            } else {

                appointments =
                    await database.all(
                        "SELECT id, name, phone, " +
                        "person, date, time, purpose, " +
                        "created_at " +
                        "FROM appointments " +
                        "ORDER BY date ASC, " +
                        "time ASC, id DESC"
                    );
            }

            return res.json({
                success: true,
                appointments:
                    appointments
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to load appointments.",
                error
            );
        }
    }
);

/* ============================================================
   GET ONE APPOINTMENT
   ============================================================ */

app.get(
    "/api/appointments/:id",
    async function (req, res) {

        try {

            const id =
                getId(req.params.id);

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid appointment ID."
                });
            }

            const appointment =
                await database.get(
                    "SELECT id, name, phone, " +
                    "person, date, time, purpose, " +
                    "created_at " +
                    "FROM appointments " +
                    "WHERE id = ?",
                    [id]
                );

            if (!appointment) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Appointment not found."
                });
            }

            return res.json({
                success: true,
                appointment:
                    appointment
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to load appointment.",
                error
            );
        }
    }
);

/* ============================================================
   CREATE APPOINTMENT
   ============================================================ */

app.post(
    "/api/appointments",
    async function (req, res) {

        try {

            const name =
                clean(req.body.name);

            const phone =
                clean(req.body.phone);

            const person =
                clean(req.body.person);

            const date =
                clean(req.body.date);

            const time =
                clean(req.body.time);

            const purpose =
                clean(req.body.purpose);

            if (
                !name ||
                !date ||
                !time
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, date and time are required."
                });
            }

            const result =
                await database.run(
                    "INSERT INTO appointments " +
                    "(name, phone, person, date, " +
                    "time, purpose) " +
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        name,
                        phone || null,
                        person || null,
                        date,
                        time,
                        purpose || null
                    ]
                );

            const appointment =
                await database.get(
                    "SELECT id, name, phone, " +
                    "person, date, time, purpose, " +
                    "created_at " +
                    "FROM appointments " +
                    "WHERE id = ?",
                    [
                        result.lastInsertRowid
                    ]
                );

            return res.status(201).json({
                success: true,
                message:
                    "Appointment created successfully.",
                appointment:
                    appointment
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to create appointment.",
                error
            );
        }
    }
);

/* ============================================================
   UPDATE APPOINTMENT
   ============================================================ */

app.put(
    "/api/appointments/:id",
    async function (req, res) {

        try {

            const id =
                getId(req.params.id);

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid appointment ID."
                });
            }

            const existing =
                await database.get(
                    "SELECT id FROM appointments " +
                    "WHERE id = ?",
                    [id]
                );

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Appointment not found."
                });
            }

            const name =
                clean(req.body.name);

            const phone =
                clean(req.body.phone);

            const person =
                clean(req.body.person);

            const date =
                clean(req.body.date);

            const time =
                clean(req.body.time);

            const purpose =
                clean(req.body.purpose);

            if (
                !name ||
                !date ||
                !time
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, date and time are required."
                });
            }

            await database.run(
                "UPDATE appointments SET " +
                "name = ?, phone = ?, person = ?, " +
                "date = ?, time = ?, purpose = ? " +
                "WHERE id = ?",
                [
                    name,
                    phone || null,
                    person || null,
                    date,
                    time,
                    purpose || null,
                    id
                ]
            );

            const appointment =
                await database.get(
                    "SELECT id, name, phone, " +
                    "person, date, time, purpose, " +
                    "created_at " +
                    "FROM appointments " +
                    "WHERE id = ?",
                    [id]
                );

            return res.json({
                success: true,
                message:
                    "Appointment updated successfully.",
                appointment:
                    appointment
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to update appointment.",
                error
            );
        }
    }
);

/* ============================================================
   DELETE APPOINTMENT
   ============================================================ */

app.delete(
    "/api/appointments/:id",
    async function (req, res) {

        try {

            const id =
                getId(req.params.id);

            if (!id) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid appointment ID."
                });
            }

            const result =
                await database.run(
                    "DELETE FROM appointments " +
                    "WHERE id = ?",
                    [id]
                );

            if (
                result.changes === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Appointment not found."
                });
            }

            return res.json({
                success: true,
                message:
                    "Appointment deleted successfully."
            });

        } catch (error) {

            return errorResponse(
                res,
                "Unable to delete appointment.",
                error
            );
        }
    }
);

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */

app.get(
    "/api/search",
    async function (req, res) {

        try {

            const search =
                clean(
                    req.query.q ||
                    req.query.search
                );

            if (!search) {

                return res.json({
                    success: true,
                    visitors: [],
                    appointments: []
                });
            }

            const term =
                "%" + search + "%";

            const visitors =
                await database.all(
                    "SELECT id, name, phone, " +
                    "purpose, person, created_at " +
                    "FROM visitors " +
                    "WHERE name LIKE ? " +
                    "OR phone LIKE ? " +
                    "OR purpose LIKE ? " +
                    "OR person LIKE ? " +
                    "ORDER BY id DESC",
                    [
                        term,
                        term,
                        term,
                        term
                    ]
                );

            const appointments =
                await database.all(
                    "SELECT id, name, phone, " +
                    "person, date, time, purpose, " +
                    "created_at " +
                    "FROM appointments " +
                    "WHERE name LIKE ? " +
                    "OR phone LIKE ? " +
                    "OR person LIKE ? " +
                    "OR date LIKE ? " +
                    "OR time LIKE ? " +
                    "OR purpose LIKE ? " +
                    "ORDER BY id DESC",
                    [
                        term,
                        term,
                        term,
                        term,
                        term,
                        term
                    ]
                );

            return res.json({
                success: true,
                visitors: visitors,
                appointments:
                    appointments
            });

        } catch (error) {

            return errorResponse(
                res,
                "Search failed.",
                error
            );
        }
    }
);

/* ============================================================
   404
   ============================================================ */

app.use(
    function (req, res) {

        return res.status(404).json({
            success: false,
            message:
                "API endpoint or page not found.",
            path: req.path
        });
    }
);

/* ============================================================
   ERROR HANDLER
   ============================================================ */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "Unhandled server error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error."
        });
    }
);

/* ============================================================
   START SERVER
   ============================================================ */

async function startServer() {

    try {

        await database.initializeDatabase();

        console.log(
            "============================================================"
        );

        console.log(
            "             AI RECEPTIONIST - SERVER 2"
        );

        console.log(
            "============================================================"
        );

        const server =
            app.listen(
                PORT,
                HOST,
                function () {

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
                        "Database:   Turso connected"
                    );

                    console.log(
                        "============================================================"
                    );
                }
            );

        function shutdown(signal) {

            console.log("");
            console.log(
                signal + " received."
            );

            server.close(
                function () {

                    try {

                        database.close();

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
                }
            );
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

    } catch (error) {

        console.error(
            "Unable to start AI Receptionist:",
            error
        );

        process.exit(1);
    }
}

/* ============================================================
   START
   ============================================================ */

startServer();