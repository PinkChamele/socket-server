import { createClient } from 'redis';
import type { RedisClientOptions } from '@redis/client';
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

type DefaultRedisClient = ReturnType<typeof createClient>;

@Injectable()
export default class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redisClient: DefaultRedisClient;

  constructor(serviceOptions: RedisClientOptions) {
    this.redisClient = createClient(serviceOptions);
  }

  getClient() {
    return this.redisClient;
  }

  async onModuleInit() {
    await this.redisClient.connect();
  }

  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }
}
