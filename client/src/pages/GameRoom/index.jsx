import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlayerHand from '../../components/player-hand';
import PlayBoard from '../../components/play-board';
import { socket } from '../../util/socket';

import backgroundImage from '../../assets/pages/background.jpg';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState(null);
  const [roomClosed, setRoomClosed] = useState(false);

  console.log('GameRoom component rendering');
  console.log('roomId from useParams:', roomId);

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    if (!username) {
      navigate(`/room/${roomId}/waiting`);
      return;
    }
    
    setUsername(username);
    setPlayerId(socket.id);

    if (!socket.connected) {
      socket.connect();
    }

    // Join the room explicitly
    socket.emit('join_room', { roomId, username });

    socket.on('update_game_state', (state) => {
      console.log('Received update_game_state event:', state);
      if (!state) {
        console.warn('Received null or undefined game state');
        return;
      }
      setGameState(state);
      setPlayers(state.players);
      setCurrentPlayerId(state.currentPlayerId);
    });

    // Request current game state explicitly
    socket.emit('request_game_state', { roomId });

    socket.on('room_closed', () => {
      setRoomClosed(true);
    });

    socket.on('connect', () => {
      console.log('Reconnected to server');
      socket.emit('join_room', { roomId, username });
      socket.emit('request_game_state', { roomId });
    });

    return () => {
      socket.off('update_game_state');
      socket.off('room_closed');
      socket.off('connect');
    };
  }, [roomId, navigate]);


  console.log('Received game state:', gameState);
  console.log(currentPlayerId);

  if (roomClosed) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>The host has left. The room is now closed.</h2>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'start',
        // alignItems: 'flex-start',
        padding: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(to top right, #f9fafb, #e5e7eb, #d1d5db)',
      }}
    >
      {/* Background image */}
      <img
        src={backgroundImage}
        alt="Background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.5, // softer so it doesn’t fight the gradient
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'luminosity', // optional, gives a soft ink-wash feel
        }}
      />
      
      <PlayBoard gameState={gameState} playerId={playerId} />

      {error && (
        <div style={{ color: 'red', position: 'absolute', top: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
