import pool from "../config/db.js";
import {v4 as uuidv4} from 'uuid';
import { GradeEntry, Records } from "../types/records.interface.js";


export const createAcademicRecordService = async(
    student_id: string,
    doc_url: string,
    extracted_grades: GradeEntry[]
): Promise<Records> => {
    const id = uuidv4();
    const result = await pool.query(
        `INSERT INTO academic_records(record_id, student_id, document_url, extracted_grades, status) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        [id, student_id, doc_url, extracted_grades]
    );
    return result.rows[0];
}