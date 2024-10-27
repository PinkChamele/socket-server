import ConfigNamespace from './config-namespace';

export interface IRedisConfig {
  readonly host: string;
  readonly port: number;
  readonly keyPrefix: string;
  readonly password: string;
}

const redisConfig = new ConfigNamespace<IRedisConfig>('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  keyPrefix: process.env.REDIS_USER ?? '',
  password: process.env.REDIS_PASSWORD ?? '',
}));

export default redisConfig;

export const redisNamespaceKey = redisConfig.namespace.KEY;

export type redisNamespace = typeof redisConfig.namespace;
