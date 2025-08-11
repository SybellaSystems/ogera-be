import pool from "../config/db.js";

const createUserTable = async(): Promise<boolean> => {
    const queryText = `
        CREATE TABLE IF NOT EXISTS users (
            user_id UUID PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            mobile_number VARCHAR(15) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role roles NOT NULL DEFAULT 'student',
            two_fa_enabled BOOLEAN DEFAULT FALSE,
            two_fa_secret TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    try {
        await pool.query(queryText);
        console.log('users table has been created');
        return true;
    } catch (error) {
        console.log("An error occurred while creating the table 'users'", error);
        return false;
    }
}

export default createUserTable;