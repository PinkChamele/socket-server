import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'io',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  handleConnection(client: Socket) {
    client.join('broadcast');
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    client.leave('broadcast');
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(
    @MessageBody() { message }: { message: unknown },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Broadcasting from ${client.id}: ${message}`);
    this.server.emit('broadcast', { message });
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() { message }: { message: unknown }) {
    return message;
  }

  @SubscribeMessage('ping')
  async handlePing() {
    const delay = Math.floor(Math.random() * 1000) + 100;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return {};
  }
}
