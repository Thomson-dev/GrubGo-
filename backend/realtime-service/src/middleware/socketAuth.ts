import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types';

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Runs for every new socket connection attempt
// Client must send token in handshake: socket = io(url, { auth: { token: "Bearer ..." } })
export const socketAuthMiddleware = (
  socket: AppSocket,
  next: (err?: Error) => void
): void => {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token?.startsWith('Bearer ')) {
    return next(new Error('Authentication error: no token'));
  }

  try {
    const decoded = jwt.verify(
      token.split(' ')[1],
      process.env.JWT_SECRET as string
    ) as { id: string; role: SocketData['role'] };

    // Attach user info to the socket — available in all event handlers
    socket.data.userId = decoded.id;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
};
