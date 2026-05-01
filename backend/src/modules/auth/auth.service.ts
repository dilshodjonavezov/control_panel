import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<Record<string, unknown>> {
    const user = await this.usersService.validateCredentials(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const secret = this.getJwtSecret();
    const accessToken = jwt.sign(
      {
        username: user.username,
        roleCode: user.roleCode,
      },
      secret,
      {
        subject: String(user.id),
        expiresIn: '12h',
      },
    );

    return {
      accessToken,
      user,
    };
  }

  async me(userId: string): Promise<Record<string, unknown>> {
    return this.usersService.findOne(userId);
  }

  private getJwtSecret(): string {
    return this.configService.get<string>('auth.jwtSecret', 'control-panel-dev-jwt-secret');
  }
}
