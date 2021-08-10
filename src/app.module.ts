import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';
import * as Joi from '@hapi/joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        RABBITMQ_USER: Joi.string(),
        RABBITMQ_PASSWORD: Joi.string(),
        RABBITMQ_HOST: Joi.string(),
        POSTGRES_HOST: Joi.string(),
        POSTGRES_PORT: Joi.number(),
        POSTGRES_USER: Joi.string(),
        POSTGRES_PASSWORD: Joi.string(),
        POSTGRES_DB: Joi.string(),
      }),
    }),
    DatabaseModule,
    FilesModule,
  ],
})
export class AppModule {}
