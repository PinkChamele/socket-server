import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WsRedisAdapter from './ws-redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const wsRedisAdapter = new WsRedisAdapter(app);

  app.useWebSocketAdapter(wsRedisAdapter);
  app.enableCors({ origin: '*' });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(console.error);
