import ConfigNamespace from './config-namespace';

export interface IJwtConfig {
  readonly secret: string;
}

const jwtConfig = new ConfigNamespace<IJwtConfig>('jwt', () => ({
  secret:
    process.env.JWT_SECRET ??
    '283f01ccce922bcc2399e7f8ded981285963cec349daba382eb633c1b3a5f282',
}));

export default jwtConfig;

export const jwtNamespaceKey = jwtConfig.namespace.KEY;

export type jwtNamespace = typeof jwtConfig.namespace;
