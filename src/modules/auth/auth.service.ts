import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    // ❌ SYSTEM_ADMIN & CLINIC_ADMIN cannot sign up manually
    if (dto.role === 'SYSTEM_ADMIN' || dto.role === 'CLINIC_ADMIN') {
      throw new UnauthorizedException(
        'Admin accounts can only be created by the System Admin.',
      );
    }

    // Check duplicate email
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours expiry

    const user = await this.userService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      password: hashedPassword,
      role: dto.role,
      emailVerified: false,
      verificationToken,
      tokenExpiry,
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.name,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  async login(dto: LoginDto) {
    // ⭐ HARD-CODED SUPER ADMIN (NO DB RECORD REQUIRED)
    const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
    const SUPER_ADMIN_PASSWORD = '12345';

    if (
      dto.email === SUPER_ADMIN_EMAIL &&
      dto.password === SUPER_ADMIN_PASSWORD &&
      dto.role === 'SYSTEM_ADMIN'
    ) {
      const token = await this.jwt.signAsync({
        userId: 'SUPER_ADMIN_DEV',
        role: 'SYSTEM_ADMIN',
      });

      return {
        accessToken: token,
        user: {
          id: 'SUPER_ADMIN_DEV',
          name: 'Developer Super Admin',
          email: SUPER_ADMIN_EMAIL,
          phone: null,
          isActive: true,
          role: 'SYSTEM_ADMIN',
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }

    // ⭐ NORMAL LOGIN (CLINIC ADMIN + OTHER USERS)
    const user = await this.userService.findByEmailAndRole(dto.email, dto.role);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(
      dto.password ?? '',
      user.password ?? '',
    );

    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    // ✅ Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    const accessToken = await this.jwt.signAsync({
      userId: user.id,
      role: user.role,
    });

    return {
      accessToken,
      user
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userService.findByVerificationToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (user.tokenExpiry && new Date() > user.tokenExpiry) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Update user
    await this.userService.verifyUserEmail(user.id);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      message: 'Email verified successfully! You can now log in.',
      success: true,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    await this.userService.updateVerificationToken(user.id, verificationToken, tokenExpiry);

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.name,
    );

    return {
      message: 'Verification email sent successfully. Please check your inbox.',
      success: true,
    };
  }
}
