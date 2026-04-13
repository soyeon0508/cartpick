import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let code: string;
    let message: string;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        code = HttpStatus[status] ?? 'UNKNOWN_ERROR';
        message = exceptionResponse;
      } else {
        const res = exceptionResponse as Record<string, unknown>;
        code = (res.error as string) ?? HttpStatus[status] ?? 'UNKNOWN_ERROR';
        message = Array.isArray(res.message)
          ? (res.message as string[]).join(', ')
          : (res.message as string) ?? 'An error occurred';
        if (Array.isArray(res.message) && res.message.length > 1) {
          details = res.message;
        }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = 'Internal server error';

      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(new ApiErrorResponse(code, message, details));
  }
}
