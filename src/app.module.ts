import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    HealthModule,
  ],
})
export class AppModule {}
