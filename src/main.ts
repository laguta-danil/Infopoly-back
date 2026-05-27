import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AppConfigService } from './config/app-config.service';
import { setupSwagger } from './swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(config.apiPrefix);

  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
  });

  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new PrismaExceptionFilter());

  setupSwagger(app);

  await app.listen(config.port);
}
void bootstrap();
