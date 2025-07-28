import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images/:type')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('type') type: string,
  ) {
    if (!['events', 'tasks'].includes(type)) {
      throw new BadRequestException('Invalid upload type. Must be "events" or "tasks"');
    }

    const imageUrls = await this.uploadService.uploadImages(files, type as 'events' | 'tasks');
    
    return {
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      imageUrls,
      count: files.length,
    };
  }

  @Post('image/:type')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadSingleImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
  ) {
    if (!['events', 'tasks', 'avatars'].includes(type)) {
      throw new BadRequestException('Invalid upload type. Must be "events", "tasks", or "avatars"');
    }

    const imageUrl = await this.uploadService.uploadSingleImage(file, type as 'events' | 'tasks' | 'avatars');
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    };
  }

  @Post('image/:type/with-thumbnail')
  @ApiOperation({ summary: 'Upload image with thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image and thumbnail uploaded successfully' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImageWithThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
  ) {
    if (!['events', 'tasks'].includes(type)) {
      throw new BadRequestException('Invalid upload type. Must be "events" or "tasks"');
    }

    const [imageUrl, thumbnailUrl] = await Promise.all([
      this.uploadService.uploadSingleImage(file, type as 'events' | 'tasks'),
      this.uploadService.createThumbnail(file, type),
    ]);

    return {
      success: true,
      message: 'Image and thumbnail uploaded successfully',
      imageUrl,
      thumbnailUrl,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Upload any file (for chat, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileUrl = await this.uploadService.uploadChatFile(file);

    return {
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
