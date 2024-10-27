import { RedisClientOptions } from '@redis/client';
import { Global, Module, Provider } from '@nestjs/common';
import { IRedisModuleAsyncOptions } from '@v1/redis/interfaces/redis-module-async-options.interface';
import RedisService from '@v1/redis/redis.service';

@Global()
@Module({})
export default class RedisModule {
  public static forRoot(serviceOptions: RedisClientOptions) {
    const provider: Provider<RedisService> = {
      provide: RedisService,
      useValue: new RedisService(serviceOptions),
    };

    return {
      module: RedisModule,
      providers: [provider],
      exports: [provider],
    };
  }

  public static async forRootAsync(
    asyncModuleOptions: IRedisModuleAsyncOptions,
  ) {
    const provider: Provider<Promise<RedisService>> = {
      provide: RedisService,
      inject: asyncModuleOptions?.inject,
      useFactory: async (...injections): Promise<RedisService> => {
        const serviceOptions = await asyncModuleOptions.useFactory(
          ...injections,
        );

        return new RedisService(serviceOptions);
      },
    };

    return {
      module: RedisModule,
      imports: asyncModuleOptions?.imports,
      providers: [provider],
      exports: [provider],
    };
  }
}
