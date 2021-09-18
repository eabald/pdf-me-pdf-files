import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, SaveFileDto } from '@pdf-me/shared';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { RpcException } from '@nestjs/microservices';
import { promises } from 'fs';
import { join } from 'path';
@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService,
  ) {}

  async save(fileData: SaveFileDto) {
    const uploadResult = await this.createFile(fileData.file);
    const fileRecord = await this.fileRepository.create({
      filename: uploadResult,
      ownerId: fileData.userId,
    });
    await this.fileRepository.save(fileRecord);
    return fileRecord;
  }

  async createFile(file: Buffer) {
    const filename = `${uuid()}.pdf`;
    await promises.writeFile(
      join(__dirname, '../storage/', filename),
      Buffer.from(file),
    );
    return filename;
  }

  async getByName(filename: string) {
    const fileInfo = await this.fileRepository.findOne({
      filename: `${filename}.pdf`,
    });
    if (fileInfo) {
      const file = await promises.readFile(
        join(__dirname, '../storage/', fileInfo.filename),
      );
      return file;
    }
    throw new RpcException({
      message: 'File not found',
      statusCode: HttpStatus.NOT_FOUND,
    });
  }

  async prune() {
    const filesToDelete = await this.fileRepository.query(
      `SELECT "filename" FROM "file" WHERE "created_at" < now() - INTERVAL '2 hours';`,
    );
    filesToDelete.forEach(
      async ({ filename }) =>
        await promises.rm(join(__dirname, '../storage/', filename)),
    );
    await this.fileRepository.query(
      `DELETE FROM "file" WHERE "created_at" < now() - INTERVAL '2 hours';`,
    );
  }
}
