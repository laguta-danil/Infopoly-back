import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Auth cookie
  COOKIE_NAME: Joi.string().default('access_token'),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'none', 'strict').default('lax'),

  // Security
  BCRYPT_ROUNDS: Joi.number().min(4).max(15).default(10),

  // Swagger
  SWAGGER_PATH: Joi.string().default('api/docs'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3001'),

  // Throttler (per-IP rate limiting on /auth)
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(5),
});
