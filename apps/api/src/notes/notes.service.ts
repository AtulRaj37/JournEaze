import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyMembership(tripId: string, userId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Access denied');
    return member;
  }

  async create(tripId: string, userId: string, content: string, fileUrl?: string) {
    await this.verifyMembership(tripId, userId);
    return this.prisma.note.create({
      data: { tripId, userId, content, fileUrl },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }

  async findAll(tripId: string, userId: string) {
    await this.verifyMembership(tripId, userId);
    return this.prisma.note.findMany({
      where: { tripId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(noteId: string, userId: string, content?: string, fileUrl?: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException('You can only edit your own notes');
    
    const data: any = {};
    if (content !== undefined && content.trim() !== '') data.content = content;
    if (fileUrl !== undefined) data.fileUrl = fileUrl;

    return this.prisma.note.update({
      where: { id: noteId },
      data,
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }

  async remove(noteId: string, userId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException('You can only delete your own notes');
    await this.prisma.note.delete({ where: { id: noteId } });
    return { success: true };
  }
}
