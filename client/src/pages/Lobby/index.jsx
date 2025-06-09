// Lobby.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../util/socket'; // We'll set up a shared socket export

export default function Lobby() {
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

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
        alert("Room does not exist.");
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
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Multiplayer Game Lobby</h1>

      <div>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <button onClick={joinRoom} style={{ marginLeft: '10px' }}>
          Join Room
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={createRoom}>Create Room</button>
      </div>
    </div>
  );
}
