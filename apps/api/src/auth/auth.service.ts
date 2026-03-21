import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email },
                    { username: dto.username }
                ]
            },
        });

        if (existingUser) {
            if (existingUser.email === dto.email) {
                throw new ConflictException('Email already in use');
            }
            throw new ConflictException('Username already taken');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                name: dto.name,
                passwordHash,
            },
            select: { id: true, email: true, username: true, name: true, role: true },
        });

        return {
            user,
            accessToken: this.jwtService.sign({ sub: user.id, email: user.email, username: user.username, role: user.role }),
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.identifier },
                    { username: dto.identifier }
                ]
            },
        });

        if (!user || (!user.passwordHash)) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
            accessToken: this.jwtService.sign({ sub: user.id, email: user.email, username: user.username, role: user.role }),
        };
    }

    async validateUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, username: true, name: true, role: true },
        });
    }

    async googleLogin(googleUser: { email: string; name: string; image?: string }) {
        if (!googleUser) {
            throw new UnauthorizedException('No user from Google');
        }

        let user = await this.prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (!user) {
            // Create new user from Google profile
            user = await this.prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    image: googleUser.image || null,
                },
            });
        } else {
            // Update image if not set
            if (!user.image && googleUser.image) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { image: googleUser.image },
                });
            }
        }

        return {
            user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role, image: user.image },
            accessToken: this.jwtService.sign({ sub: user.id, email: user.email, username: user.username, role: user.role }),
        };
    }
}
