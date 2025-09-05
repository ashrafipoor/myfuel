import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RequestWithRawBody } from '../../main';

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: RequestWithRawBody = context.switchToHttp().getRequest();

    // 1. Get headers from the request
    const signature = request.headers['x-signature'] as string;
    const timestamp = request.headers['x-signature-timestamp'] as string;
    const { rawBody } = request;

    if (!signature || !timestamp || !rawBody) {
      throw new UnauthorizedException('Missing signature headers or body.');
    }

    // 2. Prevent replay attacks by checking the timestamp
    // Reject requests older than 5 minutes
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    if (currentTime - requestTime > 5 * 60 * 1000) {
      throw new UnauthorizedException('Signature timestamp is too old.');
    }

    // 3. Get the secret key from environment variables
    const secret = this.configService.get<string>('WEBHOOK_SECRET_KEY');
    if (!secret) {
      throw new Error('WEBHOOK_SECRET_KEY is not configured.');
    }

    // 4. Generate the expected signature
    const payload = `${timestamp}.${rawBody.toString('utf-8')}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // 5. Compare signatures in a timing-safe way
    const isVerified = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );

    if (!isVerified) {
      throw new UnauthorizedException('Invalid signature.');
    }

    return true;
  }
}
