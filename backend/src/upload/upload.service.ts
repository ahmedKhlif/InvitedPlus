import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, subDir: string = ''): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Create subdirectory if specified
    const targetDir = subDir ? path.join(this.uploadDir, subDir) : this.uploadDir;
    await fs.mkdir(targetDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    const filePath = path.join(targetDir, filename);

    try {
      // For images, optimize them
      if (file.mimetype.startsWith('image/')) {
        await sharp(file.buffer)
          .resize(1920, 1080, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .webp({ quality: 85 })
          .toFile(filePath.replace(extension, '.webp'));
        
        const webpFilename = filename.replace(extension, '.webp');
        const relativePath = subDir ? `${subDir}/${webpFilename}` : webpFilename;
        
        return {
          url: `/uploads/${relativePath}`,
          filename: webpFilename,
        };
      } else {
        // For non-images, save as-is
        await fs.writeFile(filePath, file.buffer);
        const relativePath = subDir ? `${subDir}/${filename}` : filename;
        
        return {
          url: `/uploads/${relativePath}`,
          filename,
        };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath.replace('/uploads/', ''));
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error if file doesn't exist
    }
  }

  async deleteImages(imagePaths: string[]): Promise<void> {
    const deletePromises = imagePaths.map(imagePath => this.deleteFile(imagePath));
    await Promise.allSettled(deletePromises);
  }
}
