import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const useSocket = (tripId: string, userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Determine token based on your store/auth.
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const socketIo = io(URL, {
      auth: { token },
      autoConnect: true,
    });

    setSocket(socketIo);

    socketIo.on('connect', () => {
      console.log('Connected to socket', socketIo.id);
      socketIo.emit('joinTrip', { tripId, userId });
    });

    // Subscriptions
    socketIo.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketIo.on('itineraryUpdated', (data) => console.log('Itinerary Updated', data));
    socketIo.on('expensesUpdated', (data) => console.log('Expenses Updated', data));
    socketIo.on('activityLogged', (log) => setLogs((prev) => [...prev, log]));

    return () => {
      socketIo.emit('leaveTrip', { tripId, userId });
      socketIo.disconnect();
    };
  }, [tripId, userId]);

  const sendMessage = (content: string) => {
    if (socket) {
      socket.emit('sendMessage', { tripId, userId, content });
    }
  };

  return { socket, messages, sendMessage, logs };
};
