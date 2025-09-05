import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.use(express.json({ verify: (req: any, res, buf) => { req.rawBody = buf; } }));
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.listen(3000);
}
bootstrap();