import * as Joi from 'joi';
import ConfigNamespace from '../config-namespace';
import ConfigJoiValidator from '../config-joi.validator';

export interface IJwtConfig {
  secret: string;
  accessSecret: string;
  refreshSecret: string;
}

const validator = new ConfigJoiValidator<IJwtConfig>({
  secret: Joi.string().required(),
  accessSecret: Joi.string().required(),
  refreshSecret: Joi.string().required(),
});

const jwtConfig = new ConfigNamespace<IJwtConfig>(
  'jwt',
  () => ({
    secret:
      process.env.JWT_SECRET ??
      '283f01ccce922bcc2399e7f8ded981285963cec349daba382eb633c1b3a5f282',
    accessSecret:
      process.env.ACCESS_TOKEN ??
      '283f01ccce922bcc2399e7f8ded981285963cec349daba382eb633c1b3a5f282',
    refreshSecret:
      process.env.REFRESH_TOKEN ??
      '283f01ccce922bcc2399e7f8ded981285963cec349daba382eb633c1b3a5f282',
  }),
  validator,
);

export default jwtConfig;

export const jwtNamespaceKey = jwtConfig.namespace.KEY;

export type jwtNamespace = typeof jwtConfig.namespace;
