import type { IncomingMessage } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import { createAdapter, type RedisAdapter } from '@socket.io/redis-adapter';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import RedisService from './redis/redis.service';
import { type jwtNamespace, jwtNamespaceKey } from './config/jwt.config';

type AllowCallback = (
  error: string | null | undefined,
  success: boolean,
) => void;

export default class SocketIoRedisAdapter extends IoAdapter {
  protected readonly redisAdapter: (nsp: unknown) => RedisAdapter;

  private readonly jwtService: JwtService;

  private readonly accessSecret: string;

  constructor(app: INestApplication) {
    super(app);

    const redisService = app.get<RedisService>(RedisService);
    const pubClient = redisService.getClient();
    const subClient = pubClient.duplicate();

    this.accessSecret =
      app.get<ConfigType<jwtNamespace>>(jwtNamespaceKey).accessSecret;
    this.jwtService = app.get<JwtService>(JwtService);
    this.redisAdapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.create(port, {
      ...options,
      allowRequest: (req, cb) => this.allowRequest(req, cb),
      cors: { origin: '*' },
    });

    server.adapter(this.redisAdapter);

    return server;
  }

  private allowRequest(
    request: IncomingMessage,
    callback: AllowCallback,
  ): void {
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return callback('token is missing', false);
    }

    try {
      this.jwtService.verify(token, { secret: this.accessSecret });

      return callback(null, true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'something went wrong while verifying token';

      return callback(message, false);
    }
  }
}
