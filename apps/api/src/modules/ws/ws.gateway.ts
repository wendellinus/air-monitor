import type { IncomingMessage } from 'http';

import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
} from '@nestjs/websockets';
import type { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/api/v1/ws' })
export class WsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(WsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: WebSocket, req: IncomingMessage): void {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined) ??
      req.socket.remoteAddress ??
      'unknown';
    this.logger.log(`client connected: ${ip}`);

    client.on('message', (data) => {
      const msg = typeof data === 'string' ? data : data.toString('utf8');
      const response = `Server received: ${msg} at ${new Date().toISOString()}`;
      client.send(response);
    });

    client.on('close', () => {
      this.logger.log(`client disconnected: ${ip}`);
    });
  }
}

