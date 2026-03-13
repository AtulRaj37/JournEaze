import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

@Controller('uploads')
export class UploadsController {
  constructor(private configService: ConfigService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const apiUrl = this.configService.get<string>('API_URL') || `http://localhost:${this.configService.get('PORT') || 3000}`;
    const fileUrl = `${apiUrl}/uploads/${file.filename}`;

    return {
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: file.filename,
    };
  }
}
