import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@journeaze/database';

@UseGuards(JwtAuthGuard)
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('trips/:tripId/notes')
  create(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: { content: string; fileUrl?: string },
  ) {
    return this.notesService.create(tripId, user.id, body.content, body.fileUrl);
  }

  @Get('trips/:tripId/notes')
  findAll(@Param('tripId') tripId: string, @CurrentUser() user: User) {
    return this.notesService.findAll(tripId, user.id);
  }

  @Patch('notes/:noteId')
  update(
    @Param('noteId') noteId: string,
    @CurrentUser() user: User,
    @Body() body: { content?: string; fileUrl?: string },
  ) {
    return this.notesService.update(noteId, user.id, body.content, body.fileUrl);
  }

  @Delete('notes/:noteId')
  remove(@Param('noteId') noteId: string, @CurrentUser() user: User) {
    return this.notesService.remove(noteId, user.id);
  }
}
