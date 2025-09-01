import { Request, Response } from "express";
import { CustomError } from "@/utils/custom-error";
import { StatusCodes } from "http-status-codes";
import { Messages } from "@/utils/messages";
import { ResponseFormat } from "@/exception/responseFormat";
import { asyncHandler } from "@/middlewares/errorHandler";
import { cleanupFile, UploadError, isValidUploadedFile } from "../../middlewares/multer";
import { uploadToCloudinary } from "../../config/cloudinary";
import fs from "fs/promises";
import { DB } from "@/database/index";

const RecordsModel = DB.AcademicRecord;
const response = new ResponseFormat();

export const uploadReportCard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      user,
      file,
      params: { studentId },
    } = req;
    let { student_id, extracted_grades } = req.body;

    if (!user) {
      throw new CustomError("User not authenticated.", StatusCodes.UNAUTHORIZED);
    }
    const { userId, role } = user;

    if (!student_id || !extracted_grades) {
      throw new CustomError(Messages.User.FIELD, StatusCodes.BAD_REQUEST);
    }

    if (role === "student" && userId !== studentId) {
      throw new CustomError(
        Messages.User.UPLOAD_ONLY_FOR_STUDENT,
        StatusCodes.FORBIDDEN
      );
    }

    if (typeof extracted_grades === "string") {
      try {
        extracted_grades = JSON.parse(extracted_grades);
      } catch {
        throw new CustomError(
          "Invalid JSON format for extracted_grades.",
          StatusCodes.BAD_REQUEST
        );
      }
    }

    const transaction = await DB.sequelize.transaction();

    try {
      if (!file) {
        throw new CustomError(UploadError.NO_FILE, StatusCodes.NOT_FOUND);
      }
      if (!isValidUploadedFile(file)) {
        throw new CustomError(
          UploadError.UPLOAD_FAILED,
          StatusCodes.BAD_REQUEST
        );
      }

      // Upload file to Cloudinary
      const result = await uploadToCloudinary(file.path, {
        folder: `students/${userId}/report-card`,
      });

      // Insert record in DB inside transaction
      await RecordsModel.create(
        {
          student_id,
          document_url: result.secure_url,
          extracted_grades,
        },
        { transaction }
      );

      // Commit transaction before cleaning file
      await transaction.commit();

      // Remove local file after commit
      await fs.unlink(file.path);

      const data = {
        url: result.secure_url,
        publicId: result.public_id,
      };
      response.response(
        res,
        true,
        StatusCodes.OK,
        data,
        Messages.User.UPLOAD_SUCCESSFUL
      );
    } catch (error) {
      await transaction.rollback();

      if (file?.path) {
        cleanupFile(file.path);
      }

      console.error("Upload error:", error);
      throw new CustomError(
        UploadError.UPLOAD_FAILED,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
);
