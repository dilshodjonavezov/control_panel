import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Control Panel API')
    .setDescription('Backend API for the citizen lifecycle control panel')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  document.security = [{ 'access-token': [] }];
  SwaggerModule.setup(process.env.SWAGGER_PATH || 'docs', app, document);

  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '127.0.0.1';
  await app.listen(port, host);

  // eslint-disable-next-line no-console
  console.log(`Backend started on http://${host}:${port}`);
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap backend', error);
  process.exit(1);
});
