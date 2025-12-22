import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(BASE_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('📶 Socket connected to server');
        });

        socket.on('connect_error', (error) => {
            console.error('📶 Socket connection error:', error);
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
