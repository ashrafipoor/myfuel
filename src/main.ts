import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { Request } from 'express';
import { IncomingMessage } from 'http';

// Create a custom interface to add `rawBody` to the Request type
export interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  // Use the corrected function signature for the verify callback
  app.use(
    express.json({
      verify: (req: IncomingMessage, res, buf) => {
        // Cast through 'unknown' to safely convert the types
        (req as unknown as RequestWithRawBody).rawBody = buf;
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MyFuel Webhook API')
    .setDescription(
      'API for processing fuel card transactions from petrol stations.',
    )
    .setVersion('1.0')
    .addTag('transactions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(3000);
}

// Handle the returned promise to satisfy the linter
bootstrap().catch((err) => {
  console.error('Error bootstrapping application:', err);
  process.exit(1);
});
