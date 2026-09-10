import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CachedResponse {
  data: any;
  timestamp: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private static cache = new Map<string, CachedResponse>();
  private static inFlight = new Set<string>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next.handle();
    }

    const userId = request.user?.id || 'anonymous';
    const cacheKey = `${userId}:${idempotencyKey}`;

    // Clean up expired cache items (> 5 mins)
    const now = Date.now();
    for (const [key, val] of IdempotencyInterceptor.cache.entries()) {
      if (now - val.timestamp > 300000) {
        IdempotencyInterceptor.cache.delete(key);
      }
    }

    // Check if an identical request is currently in flight
    if (IdempotencyInterceptor.inFlight.has(cacheKey)) {
      throw new ConflictException(
        'An identical request is currently processing. Please wait.',
      );
    }

    // Check if response already cached
    const cached = IdempotencyInterceptor.cache.get(cacheKey);
    if (cached) {
      this.logger.log(`Serving idempotent cached response for key: ${idempotencyKey}`);
      return of(cached.data);
    }

    // Mark in-flight and execute
    IdempotencyInterceptor.inFlight.add(cacheKey);

    return next.handle().pipe(
      tap({
        next: (data) => {
          IdempotencyInterceptor.inFlight.delete(cacheKey);
          IdempotencyInterceptor.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        },
        error: () => {
          IdempotencyInterceptor.inFlight.delete(cacheKey);
        },
      }),
    );
  }
}
