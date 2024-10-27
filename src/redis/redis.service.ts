import { createClient } from 'redis';
import { RedisClientOptions } from '@redis/client';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export default class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redisClient;

  constructor(serviceOptions: RedisClientOptions) {
    this.redisClient = createClient(serviceOptions);
  }

  getClient() {
    return this.redisClient;
  }

  onModuleInit() {
    this.redisClient.connect();
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }
}
