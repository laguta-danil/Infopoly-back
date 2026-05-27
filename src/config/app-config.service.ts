import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  // App
  get nodeEnv(): 'development' | 'production' | 'test' {
    return this.config.getOrThrow('NODE_ENV');
  }
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
  get port(): number {
    return this.config.getOrThrow<number>('PORT');
  }
  get apiPrefix(): string {
    return this.config.getOrThrow<string>('API_PREFIX');
  }

  // JWT
  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
  get jwtExpiresIn(): StringValue {
    return this.config.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue;
  }
  get jwtExpiresInMs(): number {
    return ms(this.jwtExpiresIn);
  }

  // Auth cookie
  get cookieName(): string {
    return this.config.getOrThrow<string>('COOKIE_NAME');
  }
  get cookieSameSite(): 'lax' | 'none' | 'strict' {
    return this.config.getOrThrow('COOKIE_SAME_SITE');
  }

  // Security
  get bcryptRounds(): number {
    return this.config.getOrThrow<number>('BCRYPT_ROUNDS');
  }

  // Swagger
  get swaggerPath(): string {
    return this.config.getOrThrow<string>('SWAGGER_PATH');
  }

  // CORS
  get corsOrigin(): string {
    return this.config.getOrThrow<string>('CORS_ORIGIN');
  }

  // Throttler
  get throttleTtl(): number {
    return this.config.getOrThrow<number>('THROTTLE_TTL');
  }
  get throttleLimit(): number {
    return this.config.getOrThrow<number>('THROTTLE_LIMIT');
  }
}
