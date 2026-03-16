import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private uploadService: UploadService,
    private prisma: PrismaService,
  ) {}

  @Post('profile-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: require('multer').diskStorage({
        destination: './uploads/profiles',
        filename: (_req: any, file: any, callback: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = require('path').extname(file.originalname);
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req: any, file: any, callback: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = this.uploadService.getFileUrl(file.filename);

    await this.prisma.user.update({
      where: { id: req.user.sub },
      data: { profileImage: fileUrl },
    });

    return {
      message: 'Profile picture uploaded successfully',
      url: fileUrl,
    };
  }

  @Post('trip-photo/:tripId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: require('multer').diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const fs = require('fs');
          const path = `./uploads/trips/${req.params.tripId}`;
          if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
          cb(null, path);
        },
        filename: (_req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = require('path').extname(file.originalname);
          cb(null, `photo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadTripPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    // Make url easily accessible (e.g. static served from main.ts?)
    // This is a bit hacky depending on how static files are served.
    // Assuming /uploads route points to root uploads dir
    const tripId = req.params.tripId;
    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'http://localhost:5000'}/uploads/trips/${tripId}/${file.filename}`;

    return {
      message: 'Trip photo uploaded successfully',
      url: fileUrl,
    };
  }
}