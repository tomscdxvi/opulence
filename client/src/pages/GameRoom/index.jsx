// GameRoom.jsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlayerHand from '../../components/player-hand';
import PlayBoard from '../../components/play-board';
import { socket } from '../../util/socket'; // shared socket instance

export default function GameRoom() {
  const { roomId } = useParams();

  useEffect(() => {
    socket.emit('join_room', roomId);
    console.log(`Joined room: ${roomId}`);
  }, [roomId]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <PlayerHand player={1} side="bottom" />
      <PlayerHand player={2} side="top" />
      <PlayerHand player={3} side="left" />
      <PlayerHand player={4} side="right" />
      <PlayBoard />
    </div>
  );
}
