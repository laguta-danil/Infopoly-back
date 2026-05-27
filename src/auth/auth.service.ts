import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../config/app-config.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, this.config.bcryptRounds);
    const user = await this.users.create(email, passwordHash);

    return this.signToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    const valid = user && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email);
  }

  private async signToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
