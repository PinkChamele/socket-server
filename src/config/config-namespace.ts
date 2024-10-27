import {
  ConfigFactory,
  ConfigFactoryKeyHost,
  ConfigObject,
  registerAs,
} from '@nestjs/config';

type FactoryAndKeyHost<T extends ConfigObject> = ConfigFactory<T> &
  ConfigFactoryKeyHost<Promise<T>>;

export default class ConfigNamespace<T extends ConfigObject> {
  readonly namespace: FactoryAndKeyHost<T>;

  constructor(namespacePrefix: string, configFactory: ConfigFactory<T>) {
    this.namespace = registerAs(namespacePrefix, async () => configFactory());
  }
}
