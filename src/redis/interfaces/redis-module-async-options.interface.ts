import { RedisClientOptions } from '@redis/client';
import { ForwardReference, Type } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common/interfaces/modules/dynamic-module.interface';

export interface IRedisModuleAsyncOptions {
  imports?: (
    | DynamicModule
    | Type
    | Promise<DynamicModule>
    | ForwardReference
  )[];
  inject?: any[];
  useFactory: (...args: any[]) => Promise<RedisClientOptions>;
}
