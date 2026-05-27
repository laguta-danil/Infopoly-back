import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from '../config/app-config.service';

export function setupSwagger(app: INestApplication): void {
  const config = app.get(AppConfigService);

  if (config.isProduction) return;

  const documentConfig = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription(
      'JWT is set as an HttpOnly cookie on `/auth/login` and `/auth/register`. ' +
        'For testing in this Swagger UI, paste the same token into the Bearer auth modal below.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken returned by /auth/login',
      },
      'bearer',
    )
    .addTag('auth', 'Registration, login, logout, current user')
    .addTag('projects', 'Per-user project management')
    .addTag('tasks', 'Tasks nested under a project')
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup(config.swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
