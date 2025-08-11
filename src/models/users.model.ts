import pool from "../config/db.js";
import {v4 as uuidv4} from 'uuid';
import type { User } from "../types/users.interface.js";

export const createUserService = async(
    email: string,
    mobile_number: string,
    password: string,
    role: 'student' | 'employer' | 'admin'
): Promise<User> => {
    const id = uuidv4();
    const result = await pool.query(
        `INSERT INTO users(user_id, email, mobile_number, password_hash, role) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        [id, email, mobile_number, password, role]
    );
    return result.rows[0];
}