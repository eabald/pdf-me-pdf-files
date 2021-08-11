import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, SaveFileDto } from '@pdf-me/shared';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { Repository, LessThan } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService,
  ) {}

  async save(fileData: SaveFileDto) {
    const filename = uuid();
    const s3 = this.setS3();
    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
        Body: fileData.file,
        Key: filename,
      })
      .promise();
    const fileRecord = await this.fileRepository.create({
      filename: uploadResult.Key,
      ownerId: fileData.userId,
    });
    return fileRecord;
  }

  async getByName(filename: string) {
    const s3 = this.setS3();

    const fileInfo = await this.fileRepository.findOne({ filename });
    if (fileInfo) {
      const stream = await s3
        .getObject({
          Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
          Key: fileInfo.filename,
        })
        .createReadStream();
      return {
        stream,
        info: fileInfo,
      };
    }
    throw new RpcException({
      message: 'File not found',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }

  private setS3() {
    return new S3({
      endpoint: this.configService.get('AWS_ENDPOINT'),
    });
  }

  async prune() {
    const dt = new Date();
    dt.setHours(dt.getHours() - 2);
    await this.fileRepository.delete({ createdAt: LessThan(dt) });
  }
}
