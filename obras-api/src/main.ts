/**
 * ObrasApp API - Main Entry Point
 *
 * This is the bootstrap file for the NestJS application.
 * Responsible for:
 * - Initializing the NestJS application instance
 * - Configuring CORS for cross-origin requests
 * - Setting up Swagger/OpenAPI documentation
 * - Registering global interceptors and filters
 * - Starting the HTTP server
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { HttpErrorFilter } from './shared/filters/http-error.filter';

/**
 * Bootstrap function - Initializes and configures the NestJS application
 *
 * Configuration includes:
 * 1. Creates NestJS application with AppModule
 * 2. Enables CORS for frontend communication (localhost:4200 and production domain)
 * 3. Configures Swagger UI for API documentation at /api endpoint
 * 4. Registers global interceptors and exception filters
 * 5. Starts the HTTP server on configured port (default: 3000)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Configuration: Allow requests from frontend (development and production)
  app.enableCors({
    origin: [
      'http://localhost:4200', // Development frontend
      'https://obrasapp-production.up.railway.app', // Production domain
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE', // Allowed HTTP methods
    credentials: true, // Allow cookies and authorization headers
  });

  // Swagger/OpenAPI Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Architect Management API')
    .setDescription('API para login de arquitectos y trabajadores')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Interactive API documentation available at /api

  // Register global middleware
  app.useGlobalInterceptors(new ResponseInterceptor()); // Standardizes HTTP responses
  app.useGlobalFilters(new HttpErrorFilter()); // Centralized error handling

  // Start HTTP server on configured port
  await app.listen(process.env.PORT ?? 3000);
}

// Execute bootstrap function
bootstrap();
