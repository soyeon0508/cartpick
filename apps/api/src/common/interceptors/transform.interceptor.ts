import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Already wrapped (e.g. PaginatedResponse) — pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data as unknown as ApiResponse<T>;
        }
        return new ApiResponse(data);
      }),
    );
  }
}
