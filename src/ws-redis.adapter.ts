import * as http from 'node:http';
import * as https from 'node:https';
import type { Http2SecureServer, Http2Server } from 'http2';
import {
  fromEvent,
  type Observable,
  filter,
  first,
  map,
  mergeMap,
  share,
  takeUntil,
} from 'rxjs';
import {
  Server,
  type ServerOptions,
  type Namespace,
  type Socket,
} from 'socket.io';
import { MessageMappingProperties } from '@nestjs/websockets';
import type { WebSocketAdapter } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import {
  CONNECTION_EVENT,
  DISCONNECT_EVENT,
} from '@nestjs/websockets/constants';
import { createAdapter, type RedisAdapter } from '@socket.io/redis-adapter';
import RedisService from './redis/redis.service';

import {
  EventsMap,
  ReservedOrUserEventNames,
  ReservedOrUserListener,
} from 'socket.io/dist/typed-events';
import { DisconnectReason } from 'socket.io/dist/socket-types';

type Acknowledgment = (...args: unknown[]) => unknown;

interface Options extends ServerOptions {
  readonly namespace?: string;
  readonly server?: Server;
}

type ServerInstance =
  | http.Server
  | https.Server
  | Http2SecureServer
  | Http2Server;

interface Payload<TData> {
  readonly data?: TData;
  readonly ack?: Acknowledgment;
}

interface TransformedResponse<TData> {
  readonly event?: string;
  readonly data?: TData;
}

type DisconnectEventMap = Record<
  string,
  (reason: DisconnectReason, description?: any) => void
>;

type SocketSocketDisconnectListener = ReservedOrUserListener<
  EventsMap,
  EventsMap,
  ReservedOrUserEventNames<DisconnectEventMap, EventsMap>
>;

type SocketSocketConnectListener = ReservedOrUserListener<
  EventsMap,
  EventsMap,
  ReservedOrUserEventNames<EventsMap, EventsMap>
>;

type Callback<TInput, TOutput> = (data: TInput, ack: Acknowledgment) => TOutput;

type Transform<TInput, TOutput> = (
  data: TOutput,
) => Observable<TransformedResponse<TInput>>;

type MessageSource<TData> = Observable<
  [TransformedResponse<TData>, Acknowledgment]
>;

export default class WsRedisAdapter
  implements WebSocketAdapter<Server, Socket, ServerOptions>
{
  private readonly httpServer: ServerInstance;
  private readonly adapterFactory: (nsp: Namespace) => RedisAdapter;

  public dropConnection: boolean;

  constructor(app: NestApplication) {
    this.httpServer = app.getUnderlyingHttpServer<ServerInstance>();

    const redisService = app.get<RedisService>(RedisService);
    const pubClient = redisService.getClient();
    const subClient = pubClient.duplicate();

    this.adapterFactory = createAdapter(pubClient, subClient);
  }

  public create(port: number, options?: Options) {
    if (!options) {
      return this.createWithAdapter(port);
    }

    const { namespace, server, ...opt } = options;
    const createdServer = this.createWithAdapter(port, opt);
    const newNamespace =
      server instanceof Server ? server.of(namespace) : namespace;

    if (newNamespace) {
      createdServer.of(namespace);
    }

    return createdServer;
  }

  createWithAdapter(port: number, options?: ServerOptions) {
    const srv = this.httpServer && !port ? this.httpServer : port;

    return new Server(srv, options).adapter(this.adapterFactory);
  }

  public bindMessageHandlers<TInput, TOutput>(
    socket: Socket,
    handlers: MessageMappingProperties[],
    transform: Transform<TInput, TOutput>,
  ) {
    const disconnectObservable = this.createDisconnectStream(socket);

    for (const { message, callback } of handlers) {
      const sourceObservable = this.createMessageStream<TInput, TOutput>(
        socket,
        message,
        callback,
        transform,
        disconnectObservable,
      );
      this.subscribeToMessageSource(sourceObservable, socket);
    }
  }

  private createDisconnectStream(socket: Socket) {
    return fromEvent<void>(socket, DISCONNECT_EVENT).pipe(share(), first());
  }

  private createMessageStream<TInput, TOutput>(
    socket: Socket,
    message: string,
    callback: Callback<TInput, TOutput>,
    transform: Transform<TInput, TOutput>,
    disconnectObservable: Observable<void>,
  ): MessageSource<TInput> {
    return fromEvent<TInput>(socket, message).pipe(
      mergeMap((payload) => {
        const { data, ack } = this.mapPayload<TInput>(payload);

        return transform(callback(data, ack)).pipe(
          filter((response) => response !== null && response !== undefined),
          map((response): [TransformedResponse<TInput>, Acknowledgment] => [
            response,
            ack,
          ]),
        );
      }),
      takeUntil(disconnectObservable),
    );
  }

  private subscribeToMessageSource<TData>(
    sourceObservable: MessageSource<TData>,
    socket: Socket,
  ) {
    sourceObservable.subscribe(([response, ack]) =>
      response.event
        ? socket.emit(response.event, response.data)
        : ack(response),
    );
  }

  public mapPayload<TData>(payload: TData): Payload<TData> {
    if (Array.isArray(payload)) {
      const lastElement = payload[payload.length - 1];

      if (this.isAck(lastElement)) {
        const data = payload.length > 1 ? payload.slice(0, -1) : payload[0];

        return { data, ack: lastElement };
      }
      return { data: payload };
    }

    return this.isAck(payload) ? { ack: payload } : { data: payload };
  }

  private isAck(obj: unknown): obj is Acknowledgment {
    return typeof obj === 'function';
  }

  public bindClientConnect(
    server: Server,
    callback: SocketSocketConnectListener,
  ) {
    server.on(CONNECTION_EVENT, callback);
  }

  public bindClientDisconnect(
    client: Socket,
    callback: SocketSocketDisconnectListener,
  ) {
    client.on(DISCONNECT_EVENT, callback);
  }

  public async close(server: Server) {
    if (!this.dropConnection || server.httpServer !== this.httpServer) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}
