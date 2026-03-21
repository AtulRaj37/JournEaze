import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                image: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async updateProfile(userId: string, dto: { name?: string; username?: string; image?: string }) {
        // Check username uniqueness if being changed
        if (dto.username) {
            const existing = await this.prisma.user.findFirst({
                where: { username: dto.username, NOT: { id: userId } },
            });
            if (existing) {
                throw new ConflictException('Username already taken');
            }
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.username !== undefined && { username: dto.username }),
                ...(dto.image !== undefined && { image: dto.image }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                image: true,
                role: true,
                createdAt: true,
            },
        });

        return user;
    }

    async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        // If user has a password, verify current one
        if (user.passwordHash) {
            const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
            if (!isMatch) {
                throw new UnauthorizedException('Current password is incorrect');
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.newPassword, salt);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { message: 'Password updated successfully' };
    }

    async deleteAccount(userId: string) {
        // Delete user and all related data via cascade
        await this.prisma.user.delete({ where: { id: userId } });
        return { message: 'Account deleted' };
    }
}
