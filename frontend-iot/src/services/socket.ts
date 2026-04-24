import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

let socket: Socket | null = null;
const roomsActives = new Set<string>();

export function getSocket(): Socket {
  if (!socket) {
    const jeton = localStorage.getItem('jeton');
    socket = io(SOCKET_URL, {
      auth: { token: jeton },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      // Re-rejoindre toutes les rooms actives après reconnexion
      roomsActives.forEach(machineId => {
        socket!.emit('joinMachine', machineId);
      });
    });

    socket.on('disconnect', (_reason) => {});

    socket.on('connect_error', (_err) => {});
  }
  return socket;
}

export function rejoindreMachine(machineId: string) {
  roomsActives.add(machineId);
  const s = getSocket();
  s.emit('joinMachine', machineId);
}

export function quitterMachine(machineId: string) {
  roomsActives.delete(machineId);
  const s = getSocket();
  s.emit('leaveMachine', machineId);
}

export function deconnecterSocket() {
  if (socket) {
    roomsActives.clear();
    socket.disconnect();
    socket = null;
  }
}
