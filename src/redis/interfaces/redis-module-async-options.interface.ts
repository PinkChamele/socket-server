import type { RedisClientOptions } from '@redis/client';
import type {
  Type,
  ForwardReference,
  InjectionToken,
  DynamicModule,
  OptionalFactoryDependency,
} from '@nestjs/common';

export interface IRedisModuleAsyncOptions {
  imports?: (
    | DynamicModule
    | Type
    | Promise<DynamicModule>
    | ForwardReference
  )[];
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  useFactory: (
    ...args: unknown[]
  ) => RedisClientOptions | Promise<RedisClientOptions>;
}
