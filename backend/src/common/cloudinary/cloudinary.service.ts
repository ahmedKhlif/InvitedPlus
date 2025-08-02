import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as sharp from 'sharp';

@Injectable()
export class CloudinaryService {
  private readonly uploadPreset: string;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    console.log('🌤️ Cloudinary Configuration:');
    console.log('Cloud Name:', cloudName ? `✅ Set (${cloudName})` : '❌ Missing');
    console.log('API Key:', apiKey ? '✅ Set' : '❌ Missing');
    console.log('API Secret:', apiSecret ? '✅ Set' : '❌ Missing');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.uploadPreset = this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET') || 'invited-plus-uploads';
    console.log('Upload Preset:', this.uploadPreset);
    console.log('Cloudinary Configured:', this.isConfigured() ? '✅ Yes' : '❌ No');
  }

  async uploadFile(
    file: Express.Multer.File,
    options: any = {}
  ): Promise<{ url: string; publicId: string; filename: string }> {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            upload_preset: this.uploadPreset,
            resource_type: 'auto',
            ...options,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = result as any;

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: uploadResult.original_filename || file.originalname,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException('Failed to upload file to cloud storage');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    options: any = {}
  ): Promise<{ url: string; publicId: string; filename: string }> {
    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image');
      }

      // Process image with Sharp for optimization
      let processedBuffer = file.buffer;

      if (file.size > 1024 * 1024) { // If larger than 1MB, optimize
        processedBuffer = await sharp(file.buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toBuffer();
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            upload_preset: this.uploadPreset,
            resource_type: 'image',
            format: 'webp',
            quality: 'auto:good',
            fetch_format: 'auto',
            ...options,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(processedBuffer);
      });

      const uploadResult = result as any;

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: uploadResult.original_filename || file.originalname,
      };
    } catch (error) {
      console.error('Cloudinary image upload error:', error);
      throw new BadRequestException('Failed to upload image to cloud storage');
    }
  }

  async uploadAudio(
    file: Express.Multer.File,
    options: any = {}
  ): Promise<{ url: string; publicId: string; filename: string }> {
    try {
      // Validate file type
      if (!file.mimetype.startsWith('audio/')) {
        throw new BadRequestException('File must be an audio file');
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            upload_preset: this.uploadPreset,
            resource_type: 'video', // Cloudinary uses 'video' for audio files
            ...options,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      const uploadResult = result as any;

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: uploadResult.original_filename || file.originalname,
      };
    } catch (error) {
      console.error('Cloudinary audio upload error:', error);
      throw new BadRequestException('Failed to upload audio to cloud storage');
    }
  }



  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Don't throw error for delete failures to avoid breaking the app
    }
  }

  async createThumbnail(
    file: Express.Multer.File,
    folder: string = 'thumbnails',
    size: { width: number; height: number } = { width: 300, height: 300 }
  ): Promise<{ url: string; publicId: string; filename: string }> {
    try {
      // Generate folder structure based on date
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const folderPath = `invited-plus/${folder}/${year}/${month}/${day}`;

      // Create thumbnail with Sharp
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            resource_type: 'image',
            format: 'webp',
            quality: 'auto:good',
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(thumbnailBuffer);
      });

      const uploadResult = result as any;

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: `thumb_${uploadResult.original_filename || file.originalname}`,
      };
    } catch (error) {
      console.error('Cloudinary thumbnail upload error:', error);
      throw new BadRequestException('Failed to create thumbnail');
    }
  }

  // Helper method to get optimized URL
  getOptimizedUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto:good',
      ...options,
    });
  }

  // Helper method to check if Cloudinary is configured
  isConfigured(): boolean {
    return !!(
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
      this.configService.get<string>('CLOUDINARY_API_KEY') &&
      this.configService.get<string>('CLOUDINARY_API_SECRET')
    );
  }
}
