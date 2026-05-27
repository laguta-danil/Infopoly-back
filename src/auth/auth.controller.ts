import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { UsersService } from '../users/users.service';
import {
  ApiAuthErrors,
  ApiResourceConflict,
  ApiValidationError,
} from '../swagger/common-responses';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: AppConfigService,
  ) {}

  private get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.cookieSameSite,
      maxAge: this.config.jwtExpiresInMs,
      path: '/',
    };
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User created. JWT returned in body and set as HttpOnly cookie.',
    schema: { properties: { accessToken: { type: 'string' } } },
  })
  @ApiResourceConflict('Email is already registered')
  @ApiValidationError()
  @ApiTooManyRequestsResponse({ description: 'Too many registration attempts' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto.email, dto.password);
    res.cookie(this.config.cookieName, result.accessToken, this.cookieOptions);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    description: 'JWT returned in body and set as HttpOnly cookie.',
    schema: { properties: { accessToken: { type: 'string' } } },
  })
  @ApiAuthErrors()
  @ApiValidationError()
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password);
    res.cookie(this.config.cookieName, result.accessToken, this.cookieOptions);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out — clears the auth cookie' })
  @ApiOkResponse({
    description: 'Cookie cleared',
    schema: { properties: { message: { type: 'string' } } },
  })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.config.cookieName, { path: '/' });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  @ApiOkResponse({ description: 'Current user profile' })
  @ApiAuthErrors()
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.users.findById(user.id);
    if (!profile) throw new NotFoundException('User no longer exists');
    return profile;
  }
}
