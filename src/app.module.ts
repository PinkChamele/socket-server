import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import redisConfig, {
  type redisNamespace,
  redisNamespaceKey,
} from './config/redis.config';
import jwtConfig, {
  type jwtNamespace,
  jwtNamespaceKey,
} from './config/jwt.config';
import { SignController } from './sign.controller';
import { EventsGateway } from './events.gateway';
import RedisModule from './redis/redis.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig.namespace, jwtConfig.namespace],
    }),
    RedisModule.forRootAsync({
      inject: [redisNamespaceKey],
      useFactory: ({
        host,
        port,
        password,
        keyPrefix,
      }: ConfigType<redisNamespace>) => ({
        url: `redis://${keyPrefix}:${password}@${host}:${port}`,
      }),
    }),
    JwtModule.registerAsync({
      inject: [jwtNamespaceKey],
      useFactory: (config: ConfigType<jwtNamespace>) => config,
    }),
  ],
  controllers: [SignController],
  providers: [EventsGateway],
})
export class AppModule {}
