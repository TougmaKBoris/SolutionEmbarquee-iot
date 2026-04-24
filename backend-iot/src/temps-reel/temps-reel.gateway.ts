import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class TempsReelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TempsReelGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connecte : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client deconnecte : ${client.id}`);
  }

  @SubscribeMessage('joinMachine')
  handleJoinMachine(client: Socket, machineId: string) {
    client.join(`machine:${machineId}`);
    this.logger.debug(`Client ${client.id} a rejoint la room machine:${machineId}`);
    return { event: 'joined', machineId };
  }

  @SubscribeMessage('leaveMachine')
  handleLeaveMachine(client: Socket, machineId: string) {
    client.leave(`machine:${machineId}`);
    this.logger.debug(`Client ${client.id} a quitte la room machine:${machineId}`);
    return { event: 'left', machineId };
  }

  emitToMachine(machineId: string, event: string, data: any) {
    this.server.to(`machine:${machineId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
