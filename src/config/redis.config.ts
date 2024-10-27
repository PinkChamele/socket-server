import * as Joi from 'joi';
import ConfigJoiValidator from '../config-joi.validator';
import ConfigNamespace from '../config-namespace';

export interface IRedisConfig {
  host: string;
  port: number;
  keyPrefix: string;
  password: string;
}

const validator = new ConfigJoiValidator<IRedisConfig>({
  host: Joi.string().required(),
  port: Joi.number().required().min(1).max(65535),
  keyPrefix: Joi.string().required().allow(''),
  password: Joi.string().required().allow(''),
});

const redisConfig = new ConfigNamespace<IRedisConfig>(
  'redis',
  () => ({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    keyPrefix: process.env.REDIS_USER ?? '',
    password: process.env.REDIS_PASSWORD ?? '',
  }),
  validator,
);

export default redisConfig;

export const redisNamespaceKey = redisConfig.namespace.KEY;

export type redisNamespace = typeof redisConfig.namespace;
