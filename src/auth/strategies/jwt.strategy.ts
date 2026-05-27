import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../config/app-config.service';

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: AppConfigService) {
    const cookieName = config.cookieName;
    const cookieExtractor = (req: Request): string | null => {
      const cookies = req.cookies as Record<string, unknown> | undefined;
      const value = cookies?.[cookieName];
      return typeof value === 'string' ? value : null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.jwtSecret,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
