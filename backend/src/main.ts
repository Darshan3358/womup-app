import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('WormUpBackend');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile app, web, and admin panel
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Support high-resolution uploaded images & document payloads up to 50MB
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Global Validation & Serialization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global Error Filter & Standardized Response Interceptor
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Interactive Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Worm Up Quick-Commerce API')
    .setDescription(
      'Enterprise REST API & Real-time WebSocket architecture for Worm Up 9-minute hyper-local delivery platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'OTP login, registration, and dual-token rotation')
    .addTag('Stores & Serviceability', 'Dark store network and 9-min geo-serviceability checks')
    .addTag('Categories', 'Category catalog and departments')
    .addTag('Products', 'Product listing, faceted filters, and variant details')
    .addTag('Inventory', 'Store-wise stock management and 10-minute checkout reservations')
    .addTag('Cart & Pricing Engine', 'Server-authoritative pricing and checkout discounts')
    .addTag('Orders (Customer)', 'Order creation with Idempotency-Key and status tracking')
    .addTag('Store Operations (Dark Store Staff)', 'Dark store picking & packing transitions')
    .addTag('Delivery Partner Operations', 'Delivery partner assignment, live location, and fulfillment')
    .addTag('Admin Operations', 'Platform administration and order overrides')
    .addTag('Wallet', 'In-app cash wallet ledger and recharge')
    .addTag('Shopping Coins', 'Loyalty reward coins and ledger transactions')
    .addTag('Document Printing Service', 'Instant 9-min document printing with privacy auto-purge')
    .addTag('Banners & Promotions', 'Home hero banners and festive store rails')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 Worm Up Backend running on: http://localhost:${port}`);
  logger.log(`📚 Interactive Swagger Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`⚡ WebSocket Tracking Gateway active on: ws://localhost:${port}/tracking`);
}
bootstrap();
