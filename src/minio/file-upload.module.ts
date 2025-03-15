import { Module } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';
import { MinioModule } from './minio.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MinioModule, AuthModule],
  controllers: [FileUploadController],
})
export class FileUploadModule {}
