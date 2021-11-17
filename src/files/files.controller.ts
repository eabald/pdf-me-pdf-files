import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SaveFileDto } from '@eabald/pdf-me-shared';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern({ cmd: 'files-save' })
  async saveFile(@Payload() payload: SaveFileDto) {
    return await this.filesService.save(payload);
  }

  @MessagePattern({ cmd: 'files-create' })
  async createFile(@Payload() payload: Buffer) {
    return await this.filesService.createFile(payload);
  }

  @MessagePattern({ cmd: 'files-get-file' })
  async getFile(@Payload() payload: string) {
    return await this.filesService.getByName(payload);
  }

  @MessagePattern({ cmd: 'files-prune' })
  async prune() {
    return await this.filesService.prune();
  }
}
