"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFormat = void 0;
class ResponseFormat {
    response(res, success, status, data, message) {
        return res.status(status).send({
            errorCode: !success ? status : null,
            status: status,
            message: message,
            success: success,
            data: data,
        });
    }
    errorResponse(res, status, success, message) {
        return res.status(status).send({
            errorCode: status,
            success: success,
            message: message,
        });
    }
}
exports.ResponseFormat = ResponseFormat;
