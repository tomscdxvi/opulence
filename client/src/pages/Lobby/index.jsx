// Lobby.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../util/socket'; // We'll set up a shared socket export

export default function Lobby() {
  const navigate = useNavigate();
  const [room, setRoom] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const joinRoom = (e) => {
    e.preventDefault();

    const trimmedRoom = room.trim();
    if (!trimmedRoom) return;

    // Emit check to server
    socket.emit("check_room_exists", trimmedRoom, (exists) => {
      if (exists) {
        sessionStorage.setItem('roomId', trimmedRoom);
        navigate(`/room/${trimmedRoom}/waiting`);
      } else {
        setErrorMessage("Room does not exist.");
      }
    });
  };


    const createRoom = () => {
      socket.emit('create_room', (roomId) => {
          sessionStorage.setItem('roomId', roomId);
          navigate(`/room/${roomId}/waiting`);
      });
    };

  return (
    <div     
      style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
    }}>
      <div>
        <h1>Multiplayer Game Lobby</h1>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center ' }}>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={room}
            onChange={(e) => {
              setRoom(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            style={{ padding: '8px', fontSize: '16px' }}
          />
          <button onClick={joinRoom} style={{ marginLeft: '10px' }}>
            Join Room
          </button>
        </div>
        
        {errorMessage && (
          <div style={{ color: 'red', marginTop: '8px', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center ', marginTop: '24px' }}>
          <button onClick={createRoom}>Create Room</button>
        </div>
      </div>
    </div>
  );
}
