import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.use(express.json({ verify: (req: any, res, buf) => { req.rawBody = buf; } }));

  // --- Swagger Configuration ---
  const config = new DocumentBuilder()
    .setTitle('MyFuel Webhook API')
    .setDescription('API for processing fuel card transactions from petrol stations.')
    .setVersion('1.0')
    .addTag('transactions')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // <-- This sets up the UI at /api-docs
  // ---------------------------

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.listen(3000);
}
bootstrap();