import { Request, Response } from "express";
import { AppError, asyncHandler } from "../../../middlewares/errorHandler.js";
import { cleanupFile, UploadError, isValidUploadedFile } from "../../../middlewares/multer.js";
import { uploadToCloudinary } from "../../../config/cloudinary.js";
import fs from 'fs/promises';
import DB from "../../../database/db.js";

const RecordsModel = DB.AcademicRecord

export const uploadReportCard = asyncHandler(async(req: Request, res: Response): Promise<void> => {
  const {
    user,
    file,
    params: { studentId }
  } = req;
  let { student_id, extracted_grades } = req.body

  if (!user) {
    throw new AppError("User not authenticated.", 401, true);
  }
  const { userID, role } = user;

  if (role === 'student' && userID !== studentId) {
    throw new AppError("Student can only upload their own result.", 403, true);
  }
  
  if (!student_id || !extracted_grades) {
    throw new AppError("Please fill all required fields.", 400, true, "EMPTY_INPUT_FIELD");
  }
  if (typeof extracted_grades === "string") {
    try {
      extracted_grades = JSON.parse(extracted_grades);
    } catch (err) {
      throw new AppError("Invalid JSON format for extracted_grades.", 400, true);
    }
  }
  try {
    if(!file) {
      throw new AppError(UploadError.NO_FILE, 404, true);
    }
    if(!isValidUploadedFile(file)) {
      throw new AppError(UploadError.UPLOAD_FAILED, 400, true);
    }
    const result = await uploadToCloudinary(file.path, {
      folder: `students/${userID}/report-card`
    });
    console.log(result);

    await RecordsModel.create({
      student_id: student_id,
      document_url: result.secure_url,
      extracted_grades: extracted_grades
    });

    await fs.unlink(file.path);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  }catch (error) {
    if(file?.path) {
      cleanupFile(file.path);
    }
    console.log('Upload error:', error);
    throw new AppError(UploadError.UPLOAD_FAILED, 500, true);
  }
});