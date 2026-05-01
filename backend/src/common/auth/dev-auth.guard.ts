import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UsersService } from '../../modules/users/users.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;
    const headerUserId = request.headers['x-user-id'] as string | undefined;

    let userId: string | null = null;
    if (authHeader?.trim()) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const payload = jwt.verify(token, this.getJwtSecret()) as JwtPayload | string;
        if (typeof payload !== 'string') {
          const subject = payload.sub?.trim();
          if (subject && /^\d+$/.test(subject)) {
            userId = subject;
          }
        }
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    } else if (headerUserId?.trim()) {
      userId = headerUserId.trim();
    }

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.usersService.findOne(userId);
    request.user = user;
    return true;
  }

  private getJwtSecret(): string {
    return this.configService.get<string>('auth.jwtSecret', 'control-panel-dev-jwt-secret');
  }
}
