import type { IncomingMessage } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import { createAdapter, type RedisAdapter } from '@socket.io/redis-adapter';
import { JwtService } from '@nestjs/jwt';
import RedisService from './redis/redis.service';

type AllowCallback = (
  error: string | null | undefined,
  success: boolean,
) => void;

export default class WsRedisAdapter extends IoAdapter {
  protected readonly redisAdapter: (nsp: unknown) => RedisAdapter;

  private readonly jwtService: JwtService;

  constructor(app: INestApplication) {
    super(app);

    const redisService = app.get<RedisService>(RedisService);
    const pubClient = redisService.getClient();
    const subClient = pubClient.duplicate();
    this.jwtService = app.get<JwtService>(JwtService);
    this.redisAdapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      allowRequest: (req: IncomingMessage, cb: AllowCallback) =>
        this.allowRequest(req, cb),
      cors: { origin: '*' },
    });

    server.adapter(this.redisAdapter);

    return server;
  }

  private allowRequest(
    request: IncomingMessage,
    callback: AllowCallback,
  ): void {
    const url = new URL(request.url, 'http://base');
    const token = url.searchParams.get('token').split(' ')[1];

    if (!token) {
      return callback('token is missing', false);
    }

    try {
      this.jwtService.verify(token);

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
