import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadsDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  private readonly useCloudinary: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.useCloudinary = this.cloudinaryService.isConfigured();
    console.log('📤 UploadService initialized:');
    console.log('Use Cloudinary:', this.useCloudinary ? '✅ Yes' : '❌ No (using local storage)');
    if (!this.useCloudinary) {
      this.ensureUploadDirectories();
    }
  }

  private ensureUploadDirectories() {
    const directories = ['events', 'tasks', 'avatars'];
    
    directories.forEach(dir => {
      const fullPath = path.join(this.uploadsDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async uploadImages(files: Express.Multer.File[], type: 'events' | 'tasks'): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        this.validateFile(file);

        if (this.useCloudinary) {
          // Use Cloudinary for consistent image uploads
          const result = await this.cloudinaryService.uploadImage(file, {
            folder: `invited-plus/${type}`,
          });
          uploadedUrls.push(result.url);
        } else {
          // Fallback to local storage
          const url = await this.processAndSaveImage(file, type);
          uploadedUrls.push(url);
        }
      }

      return uploadedUrls;
    } catch (error) {
      // Clean up any uploaded files if there's an error (only for local storage)
      if (!this.useCloudinary) {
        await this.cleanupFiles(uploadedUrls);
      }
      throw error;
    }
  }

  async uploadSingleImage(file: Express.Multer.File, type: 'events' | 'tasks' | 'avatars'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.validateFile(file);

    if (this.useCloudinary) {
      // Use Cloudinary with proper folder structure
      const result = await this.cloudinaryService.uploadImage(file, {
        folder: `invited-plus/${type}`,
      });
      return result.url;
    }

    return await this.processAndSaveImage(file, type);
  }

  async uploadAudio(file: Express.Multer.File, folder: string = 'audio'): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('File must be an audio file');
    }

    if (this.useCloudinary) {
      const result = await this.cloudinaryService.uploadAudio(file);
      return { url: result.url, filename: result.filename };
    }

    // Fallback to local storage
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadsDir, folder, filename);

    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    await fs.promises.writeFile(filepath, file.buffer);

    return { url: `/uploads/${folder}/${filename}`, filename };
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'files'): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file size (max 50MB for general files)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large (max 50MB)');
    }

    if (this.useCloudinary) {
      const result = await this.cloudinaryService.uploadFile(file);
      return { url: result.url, filename: result.filename };
    }

    // Fallback to local storage
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadsDir, folder, filename);

    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    await fs.promises.writeFile(filepath, file.buffer);

    return { url: `/uploads/${folder}/${filename}`, filename };
  }



  private validateFile(file: Express.Multer.File) {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size too large. Maximum 10MB allowed.');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }
  }

  private async processAndSaveImage(file: Express.Multer.File, type: string): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${type}-${uniqueSuffix}.webp`;
    const filepath = path.join(this.uploadsDir, type, filename);

    try {
      // Process image: resize and convert to WebP
      let sharpInstance = sharp(file.buffer);

      // Get image metadata to determine if resizing is needed
      const metadata = await sharpInstance.metadata();
      
      // Resize if image is too large, maintaining aspect ratio
      if (metadata.width && metadata.width > 1920) {
        sharpInstance = sharpInstance.resize(1920, null, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to WebP with good quality
      await sharpInstance
        .webp({ 
          quality: 85,
          effort: 4 // Good compression vs speed balance
        })
        .toFile(filepath);

      // Return URL path
      return `/uploads/${type}/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new BadRequestException('Failed to process image');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const type = urlParts[urlParts.length - 2];
      
      const filepath = path.join(this.uploadsDir, type, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for cleanup operations
    }
  }

  async deleteImages(imageUrls: string[]): Promise<void> {
    for (const url of imageUrls) {
      await this.deleteImage(url);
    }
  }

  private async cleanupFiles(urls: string[]): Promise<void> {
    for (const url of urls) {
      await this.deleteImage(url);
    }
  }

  // Utility method to get image dimensions
  async getImageInfo(file: Express.Multer.File): Promise<{ width: number; height: number; size: number }> {
    try {
      const metadata = await sharp(file.buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: file.size
      };
    } catch (error) {
      throw new BadRequestException('Invalid image file');
    }
  }

  // Create thumbnail version
  async createThumbnail(file: Express.Multer.File, type: string): Promise<string> {
    if (this.useCloudinary) {
      // Use Cloudinary's built-in thumbnail generation
      const result = await this.cloudinaryService.createThumbnail(file, `thumbnails/${type}`);
      return result.url;
    }

    // Fallback to local storage
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${type}-thumb-${uniqueSuffix}.webp`;
    const filepath = path.join(this.uploadsDir, type, filename);

    try {
      await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(filepath);

      return `/uploads/${type}/${filename}`;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new BadRequestException('Failed to create thumbnail');
    }
  }

  async uploadChatFile(file: Express.Multer.File): Promise<string> {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Audio
      'audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/mp4',
      // Documents
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      // Text files
      'text/plain', // .txt
      'text/markdown', // .md
      'text/csv', // .csv
      'text/html', // .html
      'text/css', // .css
      'text/javascript', // .js
      'application/json', // .json
      'application/xml', // .xml
      'text/xml', // .xml
      // Archives
      'application/zip', 'application/x-zip-compressed',
      'application/x-rar-compressed', 'application/x-7z-compressed',
      // Other common formats
      'application/rtf', // .rtf
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation' // .odp
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size too large. Maximum 10MB allowed.');
    }

    const uploadDir = path.join(this.uploadsDir, 'chat');

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);

    return `/uploads/chat/${filename}`;
  }
}
