import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'rtc',
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
    client.emit('broadcast', { message });
  }
}
