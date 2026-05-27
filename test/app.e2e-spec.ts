import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

interface AuthTokenResponse {
  accessToken: string;
}

interface UserMeResponse {
  email: string;
}

interface ProjectResponse {
  id: number;
  name: string;
}

interface TaskListItem {
  status: string;
  priority: string;
}

interface PaginatedTasksResponse {
  data: TaskListItem[];
  meta: { total: number; page: number; limit: number; pageCount: number };
}

interface HealthResponse {
  status: string;
  info: { database: { status: string } };
}

describe('Task Manager API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const userA = { email: `a-${Date.now()}@test.io`, password: 'Password1' };
  const userB = { email: `b-${Date.now()}@test.io`, password: 'Password1' };

  let tokenA: string;
  let tokenB: string;
  let projectAId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
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

    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: { in: [userA.email, userB.email] } } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [userA.email, userB.email] } } });
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/register — creates user A and returns accessToken + cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userA)
        .expect(201);

      const body = res.body as AuthTokenResponse;
      expect(body.accessToken).toEqual(expect.any(String));
      expect(res.headers['set-cookie']?.[0]).toMatch(/access_token=.*HttpOnly/);
      tokenA = body.accessToken;
    });

    it('POST /api/auth/register — creates user B', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(userB)
        .expect(201);
      tokenB = (res.body as AuthTokenResponse).accessToken;
    });

    it('POST /api/auth/register — duplicate email returns 409', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(userA).expect(409);
    });

    it('POST /api/auth/login — wrong password returns 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: userA.email, password: 'WrongPass1' })
        .expect(401);
    });

    it('GET /api/auth/me — returns current user (no passwordHash)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as UserMeResponse;
      expect(body.email).toBe(userA.email);
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('GET /api/auth/me — without token returns 401', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('Projects', () => {
    it('POST /api/projects — creates project for user A', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Backend Sprint' })
        .expect(201);

      const body = res.body as ProjectResponse;
      expect(body.name).toBe('Backend Sprint');
      expect(body).not.toHaveProperty('userId');
      projectAId = body.id;
    });

    it('POST /api/projects — duplicate name for same user returns 409', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Backend Sprint' })
        .expect(409);
    });

    it('POST /api/projects — same name allowed for different user', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Backend Sprint' })
        .expect(201);
    });

    it('GET /api/projects/:id — user B cannot access user A project', async () => {
      await request(app.getHttpServer())
        .get(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('POST /api/projects — unknown property returns 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'X', extra: 'hack' })
        .expect(400);
    });
  });

  describe('Tasks', () => {
    it('POST tasks — creates tasks with varied status/priority', async () => {
      const tasks = [
        { title: 'Design schema', priority: 'high', status: 'done' },
        { title: 'Write auth', priority: 'medium', status: 'in_progress' },
        { title: 'Add tests', priority: 'low', status: 'todo' },
      ];
      for (const t of tasks) {
        await request(app.getHttpServer())
          .post(`/api/projects/${projectAId}/tasks`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send(t)
          .expect(201);
      }
    });

    it('GET tasks — filter by status=todo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectAId}/tasks?status=todo`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as PaginatedTasksResponse;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe('todo');
      expect(body.meta.total).toBe(1);
    });

    it('GET tasks — sort by priority desc returns high → medium → low', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectAId}/tasks?sortBy=priority&order=desc`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as PaginatedTasksResponse;
      expect(body.data.map((t) => t.priority)).toEqual(['high', 'medium', 'low']);
    });

    it('GET tasks — pagination meta is correct', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectAId}/tasks?page=1&limit=2`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body as PaginatedTasksResponse;
      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({ total: 3, page: 1, limit: 2, pageCount: 2 });
    });

    it('GET tasks — user B sees nothing in user A project (404)', async () => {
      await request(app.getHttpServer())
        .get(`/api/projects/${projectAId}/tasks`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Health', () => {
    it('GET /api/health — returns ok status', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      const body = res.body as HealthResponse;
      expect(body.status).toBe('ok');
      expect(body.info.database.status).toBe('up');
    });
  });
});
