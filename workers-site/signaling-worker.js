// PeerDrop Signaling Server Worker for Cloudflare
// This worker handles WebSocket connections for WebRTC signaling

export class RoomDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.roomId = null;
  }

  async fetch(request) {
    const url = new URL(request.url);
    this.roomId = url.pathname.split('/').pop();

    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Generate a unique session ID for this connection
    const sessionId = crypto.randomUUID();
    
    // Store the WebSocket connection
    this.sessions.set(sessionId, {
      socket: server,
      roomId: this.roomId
    });

    // Send a welcome message
    server.send(JSON.stringify({
      type: 'connected',
      sessionId,
      roomId: this.roomId
    }));

    // Check if this is the first or second client in the room
    if (this.sessions.size === 1) {
      // First client - created the room
      server.send(JSON.stringify({
        type: 'created',
        roomId: this.roomId
      }));
    } else if (this.sessions.size === 2) {
      // Second client - joined the room
      server.send(JSON.stringify({
        type: 'joined',
        roomId: this.roomId
      }));

      // Notify the first client that a peer has joined
      for (const [id, session] of this.sessions.entries()) {
        if (id !== sessionId) {
          session.socket.send(JSON.stringify({
            type: 'ready'
          }));
          break;
        }
      }
    } else {
      // Room is full
      server.send(JSON.stringify({
        type: 'full',
        roomId: this.roomId
      }));
      
      // Close the connection
      server.close(1000, 'Room is full');
      this.sessions.delete(sessionId);
      return new Response('Room is full', { status: 503 });
    }

    // Handle messages from the client
    server.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Forward signaling messages to the other peer
        if (['offer', 'answer', 'candidate'].includes(message.type)) {
          for (const [id, session] of this.sessions.entries()) {
            if (id !== sessionId) {
              session.socket.send(JSON.stringify(message));
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Handle WebSocket closure
    server.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      
      // Notify the other peer that this peer has disconnected
      for (const [id, session] of this.sessions.entries()) {
        if (id !== sessionId) {
          session.socket.send(JSON.stringify({
            type: 'disconnected'
          }));
          break;
        }
      }
    });

    // Return the client end of the WebSocket
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle WebSocket connections for signaling
    if (url.pathname.startsWith('/signal/')) {
      const roomId = url.pathname.split('/').pop();
      
      // Get or create a Durable Object for this room
      const roomObjectId = env.ROOMS.idFromName(roomId);
      const roomObject = env.ROOMS.get(roomObjectId);
      
      return roomObject.fetch(request);
    }
    
    // For all other requests, serve static assets
    try {
      return await getAssetFromKV(request, env);
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  }
};
