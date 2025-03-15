import {
  Controller,
  Post,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AvatarUploadDto } from './dto/avatar-upload.dto';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { MinioService } from './minio.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('file-upload')
@Controller('upload')
export class FileUploadController {
  constructor(
    private readonly minioService: MinioService,
    private readonly authService: AuthService,
  ) {}

  @Post('product-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG, PNG and GIF files are allowed!',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadProductImages(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { role } = req.user;
    if (role !== 'user') {
      throw new ForbiddenException('Only users can upload product images');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPromises = files.map((file) =>
      this.minioService.uploadFile(file),
    );
    const uploadedUrls = await Promise.all(uploadPromises);

    return {
      message: 'Files uploaded successfully',
      urls: uploadedUrls,
    };
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User avatar image file',
    type: AvatarUploadDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException(
              'Only JPG, JPEG and PNG files are allowed for avatars!',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!req.cookies || !req.cookies['user_id']) {
      throw new ForbiddenException('Authentication required');
    }

    const userId = parseInt(req.cookies['user_id']);

    if (!file) {
      throw new BadRequestException('No avatar file uploaded');
    }

    // Upload avatar to MinIO with a special prefix
    const avatarObjectName = `avatars/user-${userId}-${Date.now()}.${file.originalname
      .split('.')
      .pop()}`;

    const uploadedUrl = await this.minioService.uploadFile(
      file,
      avatarObjectName,
    );

    // Update user's avatar URL in database and get old avatar info
    const updateResult = await this.authService.updateUserAvatar(
      userId,
      uploadedUrl,
    );

    // Delete old avatar if it exists
    if (updateResult.oldAvatarObjectName) {
      try {
        await this.minioService.deleteFile(updateResult.oldAvatarObjectName);
      } catch (error) {
        // Log error but don't fail the request if old avatar deletion fails
        console.error(`Failed to delete old avatar: ${error.message}`);
      }
    }

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl: uploadedUrl,
    };
  }
}
