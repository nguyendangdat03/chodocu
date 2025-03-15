import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;
  private readonly logger = new Logger('MinioService');

  constructor(private configService: ConfigService) {
    // Initialize the MinIO client
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', '127.0.0.1'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000')),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });

    this.bucketName = this.configService.get(
      'MINIO_BUCKET_NAME',
      'product-images',
    );

    // Create bucket if it doesn't exist
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);

      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);

        // Set bucket policy to public read
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
      }
    } catch (error) {
      this.logger.error(`Error initializing bucket: ${error.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    objectName?: string,
  ): Promise<string> {
    try {
      // Generate a unique object name if not provided
      if (!objectName) {
        const fileExt = file.originalname.split('.').pop();
        objectName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
      }

      // Upload the file to MinIO
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      // Return the URL to access the file
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  getFileUrl(objectName: string): string {
    const endpoint = this.configService.get('MINIO_ENDPOINT', '127.0.0.1');
    const port = this.configService.get('MINIO_PORT', '9000');
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${objectName}`;
  }

  getMinioPublicEndpoint(): string {
    const endpoint = this.configService.get('MINIO_ENDPOINT', '127.0.0.1');
    const port = this.configService.get('MINIO_PORT', '9000');
    const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.bucketName}`;
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
