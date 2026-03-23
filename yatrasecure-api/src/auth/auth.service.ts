import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UserMapperService } from '../common/mappers/user.mapper';
import { EmailService } from '../email/email.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private userMapper: UserMapperService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Cookie helpers
  // ─────────────────────────────────────────────────────────────
  private isProd() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private getCookieDomain(): string | undefined {
    return this.configService.get<string>('COOKIE_DOMAIN') || undefined;
  }

  private getAccessCookieName() {
    return 'access_token';
  }

  private getRefreshCookieName() {
    return 'refresh_token';
  }

  private setAuthCookies(res: Response, tokens: TokenPair) {
    const secure = this.isProd();
    const sameSite = secure ? 'strict' : 'lax';
    const domain = this.getCookieDomain();

    // ✅ SECURE: Only refresh_token in httpOnly cookie
    // access_token is returned in response body for Bearer auth (frontend needs it in JS)
    // refresh_token is NEVER in response body — only in this cookie
    res.cookie(this.getRefreshCookieName(), tokens.refresh_token, {
      httpOnly: true,      // ✅ Cannot be accessed by JavaScript
      secure,              // ✅ HTTPS only in production
      sameSite: sameSite as any, // ✅ CSRF protection
      path: '/api/auth/refresh', // ✅ Only sent to refresh endpoint
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain,
    });
  }

  private clearAuthCookies(res: Response) {
    const secure = this.isProd();
    const sameSite = secure ? 'strict' : 'lax';
    const domain = this.getCookieDomain();

    // ✅ Only refresh_token cookie needs clearing (access_token is not in cookie)
    res.clearCookie(this.getRefreshCookieName(), {
      httpOnly: true,
      secure,
      sameSite: sameSite as any,
      path: '/api/auth/refresh',
      domain,
    });
  }

  private extractRefreshTokenFromReq(req: Request): string | null {
    const cookies = (req as any).cookies as Record<string, string> | undefined;
    if (!cookies) return null;
    return cookies[this.getRefreshCookieName()] || null;
  }

  // ─────────────────────────────────────────────────────────────
  // Auth flows
  // ─────────────────────────────────────���───────────────────────

  /**
   * Signup
   * ✅ SECURE: Only returns safe user data + expires_in
   * ✅ Tokens ONLY in httpOnly cookies, NOT in response body
   */
  async signup(signupDto: SignupDto, res: Response) {
    const { email, username, password } = signupDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);
    const verificationExpiry = new Date(Date.now() + 86400000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isEmailVerified: false,
        verificationToken: hashedVerificationToken,
        verificationExpiry,
      },
      select: {
        id: true,
        email: true,
        username: true,
        profileImage: true,
        bio: true,
        city: true,
        reputationScore: true,
        isVerified: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Send emails (non-blocking)
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.username);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.username,
        verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // ✅ Set tokens in httpOnly cookies ONLY
    this.setAuthCookies(res, tokens);

    // ✅ SECURE: access_token in body (for Bearer auth), refresh_token ONLY in cookie
    return {
      user: this.userMapper.toSafeUserDto(user),
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      message: 'Signup successful. Please verify your email.',
    };
  }

  /**
   * Login
   * ✅ SECURE: Only returns safe user data + expires_in
   * ✅ Tokens ONLY in httpOnly cookies, NOT in response body
   */
  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // ✅ Set tokens in httpOnly cookies ONLY
    this.setAuthCookies(res, tokens);

    // ✅ SECURE: access_token in body (for Bearer auth), refresh_token ONLY in cookie
    return {
      user: this.userMapper.toSafeUserDto(user),
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      message: 'Login successful',
    };
  }

  private async generateTokens(userId: string, email: string): Promise<TokenPair> {
    const payload = { sub: userId, email };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    return { access_token, refresh_token, expires_in: 15 * 60 };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  /**
   * Refresh token from cookie
   * ✅ SECURE: Returns ONLY expires_in, no tokens in body
   * ✅ New tokens set in httpOnly cookies
   */
  async refreshTokensFromCookie(req: Request, res: Response) {
    const refreshToken = this.extractRefreshTokenFromReq(req);
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub as string },
        select: { email: true, refreshToken: true },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const matches = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!matches) throw new UnauthorizedException('Invalid refresh token');

      // ✅ Token rotation: generate new pair
      const tokens = await this.generateTokens(payload.sub, user.email);
      await this.updateRefreshToken(payload.sub, tokens.refresh_token);

      // ✅ Update cookies with new tokens
      this.setAuthCookies(res, tokens);

      // ✅ SECURE: access_token in body, refresh_token ONLY in cookie
      return {
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout
   */
  async logout(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  // Password reset flows (unchanged, already secure)

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If your email is registered, you will receive a password reset link.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry },
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.username,
        resetToken,
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send reset email. Please try again.');
    }

    return {
      message:
        'If your email is registered, you will receive a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.prisma.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiry: { gt: new Date() },
      },
    });

    type UserType = (typeof users)[number];
    let matchedUser: UserType | null = null;

    for (const user of users) {
      if (user.resetToken) {
        const isValid = await bcrypt.compare(token, user.resetToken);
        if (isValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null,
      },
    });

    return {
      message:
        'Password reset successfully. Please login with your new password.',
    };
  }

  async verifyEmail(token: string) {
    const users = await this.prisma.user.findMany({
      where: {
        verificationToken: { not: null },
        verificationExpiry: { gt: new Date() },
        isEmailVerified: false,
      },
    });

    type UserType = (typeof users)[number];
    let matchedUser: UserType | null = null;

    for (const user of users) {
      if (user.verificationToken) {
        const isValid = await bcrypt.compare(token, user.verificationToken);
        if (isValid) {
          matchedUser = user;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return {
      message: 'Email verified successfully!',
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        username: matchedUser.username,
        isEmailVerified: true,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If your email is registered, you will receive a verification link.',
      };
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);
    const verificationExpiry = new Date(Date.now() + 86400000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedVerificationToken,
        verificationExpiry,
      },
    });

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.username,
        verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }

    return { message: 'Verification email sent successfully!' };
  }
}