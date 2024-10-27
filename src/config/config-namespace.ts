import {
  ConfigFactory,
  ConfigFactoryKeyHost,
  ConfigObject,
  registerAs,
} from '@nestjs/config';
import { IEnvValidator } from '@interfaces/env-validator.interface';

type FactoryAndKeyHost<T extends ConfigObject> = ConfigFactory<T> &
  ConfigFactoryKeyHost<Promise<T>>;

export default class ConfigNamespace<T extends ConfigObject> {
  readonly namespace: FactoryAndKeyHost<T>;

  constructor(
    protected readonly namespacePrefix: string,
    protected readonly configFactory: ConfigFactory<Partial<T>>,
    protected readonly validator?: IEnvValidator<T>,
  ) {
    this.namespace = registerAs(namespacePrefix, async () => {
      const config = <T>await this.configFactory();

      return this.validator ? this.validator.validate(config) : config;
    });
  }
}
