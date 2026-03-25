import './config/env.js';
import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';

const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: clientUrl,
        credentials: true
      }
    });

    initSocket(io);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
