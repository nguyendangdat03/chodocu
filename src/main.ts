import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser()); // Kích hoạt middleware xử lý cookie

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
