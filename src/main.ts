import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Sử dụng cookie-parser
  app.use(cookieParser());

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API documentation for the application')
    .setVersion('1.0')
    .addBearerAuth() // Thêm xác thực Bearer token nếu cần
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Tài liệu Swagger ở /api

  // Lắng nghe trên cổng 3000
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log(
    'Swagger documentation is available at: http://localhost:3000/api',
  );
}
bootstrap();
