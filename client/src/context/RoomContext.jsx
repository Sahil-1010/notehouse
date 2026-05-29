import { createContext, useContext, useState } from 'react';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nh_room')); } catch { return null; }
  });

  const joinRoom = data => {
    localStorage.setItem('nh_room', JSON.stringify(data));
    setRoom(data);
  };

  const leaveRoom = () => {
    localStorage.removeItem('nh_room');
    setRoom(null);
  };

  return (
    <RoomContext.Provider value={{ room, joinRoom, leaveRoom }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
