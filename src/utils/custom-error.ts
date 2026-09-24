export class CustomError extends Error {
    public statusCode: number;
    public status: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
