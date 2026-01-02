import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = prismaError.error;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided. Please check your input.';
      error = 'Validation Error';
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected database error occurred.';
      error = 'Database Error';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exceptionResponse;
        error = (exceptionResponse as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Send response
    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      // Unique constraint violation
      case 'P2002': {
        const target = exception.meta?.target;
        let field = 'field';
        
        if (Array.isArray(target)) {
          field = target.length > 0 ? target.join(', ') : 'field';
        } else if (typeof target === 'string') {
          field = target;
        }
        
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists.`,
          error: 'Duplicate Entry',
        };
      }

      // Record not found
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found.',
          error: 'Not Found',
        };

      // Foreign key constraint violation
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The referenced record does not exist.',
          error: 'Invalid Reference',
        };

      // Required field missing
      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'A required field is missing.',
          error: 'Missing Field',
        };

      // Failed to connect to database
      case 'P1001':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Unable to connect to the database. Please try again later.',
          error: 'Database Connection Error',
        };

      // Database timeout
      case 'P1008':
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'The database operation timed out. Please try again.',
          error: 'Database Timeout',
        };

      // Null constraint violation
      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'A required value is missing or null.',
          error: 'Null Constraint Violation',
        };

      // Record to delete does not exist
      case 'P2016':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The record you are trying to delete does not exist.',
          error: 'Record Not Found',
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred. Please try again.',
          error: 'Database Error',
        };
    }
  }
}
