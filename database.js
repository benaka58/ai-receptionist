"use strict";

require("dotenv").config({
    path: ".env.local"
});

const { createClient } = require("@libsql/client");
/* ============================================================
   TURSO DATABASE CONNECTION
   ============================================================ */

const TURSO_DATABASE_URL =
    process.env.TURSO_DATABASE_URL ||
    process.env.STORAGE_TURSO_DATABASE_URL;

const TURSO_AUTH_TOKEN =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.STORAGE_TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
    console.error(
        "ERROR: TURSO_DATABASE_URL environment variable is missing."
    );
}

if (!TURSO_AUTH_TOKEN) {
    console.error(
        "ERROR: TURSO_AUTH_TOKEN environment variable is missing."
    );
}

const db = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN
});

/* ============================================================
   DATABASE INITIALIZATION
   ============================================================ */

async function initializeDatabase() {

    await db.batch(
        [
            {
                sql:
                    "CREATE TABLE IF NOT EXISTS visitors (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "name TEXT NOT NULL, " +
                    "phone TEXT, " +
                    "purpose TEXT, " +
                    "person TEXT, " +
                    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                    ")",
                args: []
            },

            {
                sql:
                    "CREATE TABLE IF NOT EXISTS appointments (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "name TEXT NOT NULL, " +
                    "phone TEXT, " +
                    "person TEXT, " +
                    "date TEXT NOT NULL, " +
                    "time TEXT NOT NULL, " +
                    "purpose TEXT, " +
                    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                    ")",
                args: []
            }
        ],
        "write"
    );

    console.log(
        "Turso database connected successfully."
    );

    console.log(
        "Visitors and appointments tables are ready."
    );
}

/* ============================================================
   SELECT ONE ROW
   ============================================================ */

async function get(sql, args) {

    const result = await db.execute({
        sql: sql,
        args: args || []
    });

    if (
        !result.rows ||
        result.rows.length === 0
    ) {
        return null;
    }

    return result.rows[0];
}

/* ============================================================
   SELECT MULTIPLE ROWS
   ============================================================ */

async function all(sql, args) {

    const result = await db.execute({
        sql: sql,
        args: args || []
    });

    return result.rows || [];
}

/* ============================================================
   INSERT / UPDATE / DELETE
   ============================================================ */

async function run(sql, args) {

    const result = await db.execute({
        sql: sql,
        args: args || []
    });

    let lastInsertRowid =
        result.lastInsertRowid;

    if (
        typeof lastInsertRowid === "bigint"
    ) {
        lastInsertRowid =
            Number(lastInsertRowid);
    }

    return {
        changes:
            Number(result.rowsAffected || 0),

        lastInsertRowid:
            lastInsertRowid
    };
}

/* ============================================================
   TEST DATABASE CONNECTION
   ============================================================ */

async function testConnection() {

    await db.execute({
        sql: "SELECT 1",
        args: []
    });

    return true;
}

/* ============================================================
   CLOSE DATABASE CONNECTION
   ============================================================ */

function close() {

    try {

        if (
            db &&
            typeof db.close === "function"
        ) {
            db.close();
        }

    } catch (error) {

        console.error(
            "Database close error:",
            error
        );
    }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    db: db,
    initializeDatabase: initializeDatabase,
    testConnection: testConnection,
    get: get,
    all: all,
    run: run,
    close: close
};