import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  constructor() {
    this.ensureUploadDirectories();
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
        const url = await this.processAndSaveImage(file, type);
        uploadedUrls.push(url);
      }

      return uploadedUrls;
    } catch (error) {
      // Clean up any uploaded files if there's an error
      await this.cleanupFiles(uploadedUrls);
      throw error;
    }
  }

  async uploadSingleImage(file: Express.Multer.File, type: 'events' | 'tasks' | 'avatars'): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.validateFile(file);
    return await this.processAndSaveImage(file, type);
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
}
