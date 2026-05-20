import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class ReviewRateLimitGuard implements CanActivate {
  // Store timestamps for each user's review submissions
  private readonly userRequests = new Map<number, number[]>();
  
  // Configuration
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 3;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const now = Date.now();
    const timestamps = this.userRequests.get(userId) || [];

    // Filter out timestamps outside the time window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.WINDOW_MS,
    );

    // Check if user has exceeded the limit
    if (validTimestamps.length >= this.MAX_REQUESTS) {
      throw new HttpException(
        {
          error: 'TOO_MANY_REQUESTS',
          message: 'Too many review requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.userRequests.set(userId, validTimestamps);

    return true;
  }

  clearAll(): void {
    this.userRequests.clear();
  }
}