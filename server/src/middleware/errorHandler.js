import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Server Error';

  console.error(`[Error] ${message}\n${err.stack}`);

  errorResponse(res, message, statusCode);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
