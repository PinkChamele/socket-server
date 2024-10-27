import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import redisConfig, {
  type redisNamespace,
  redisNamespaceKey,
} from '../config/redis.config';
import jwtConfig from '../config/jwt.config';
import { EventsGateway } from '../events.gateway';
import RedisModule from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig.namespace, jwtConfig.namespace],
    }),
    RedisModule.forRootAsync({
      inject: [redisNamespaceKey],
      useFactory: async ({
        host,
        port,
        password,
        keyPrefix,
      }: ConfigType<redisNamespace>) => ({
        url: `redis://${keyPrefix}:${password}@${host}:${port}`,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
