import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*', // For development. Update pointing to web domain in production.
  },
})
export class TripGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTrip')
  async handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string; userId: string },
  ) {
    const { tripId, userId } = payload;
    
    // Verify membership
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });

    if (member) {
      client.join(`trip-${tripId}`);
      console.log(`User ${userId} joined room trip-${tripId}`);
      // Notify others in room
      this.server.to(`trip-${tripId}`).emit('userJoined', { userId });
    } else {
      client.emit('error', 'Unauthorized to join this trip');
    }
  }

  @SubscribeMessage('leaveTrip')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string; userId: string },
  ) {
    const { tripId, userId } = payload;
    client.leave(`trip-${tripId}`);
    this.server.to(`trip-${tripId}`).emit('userLeft', { userId });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string; userId: string; content: string },
  ) {
    const { tripId, userId, content } = payload;
    
    // Save to DB
    const message = await this.prisma.message.create({
      data: { tripId, userId, content },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    // Broadcast
    this.server.to(`trip-${tripId}`).emit('newMessage', message);
  }

  // --- Utility specific for broadcasting changes from other services ---
  broadcastTripUpdate(tripId: string, eventName: string, data: any) {
    this.server.to(`trip-${tripId}`).emit(eventName, data);
  }
}
