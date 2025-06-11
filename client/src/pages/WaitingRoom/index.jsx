// WaitingRoom.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../../util/socket';

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false); // Track if user has entered their name
  const [error, setError] = useState('');
  const [roomClosed, setRoomClosed] = useState(false);

  useEffect(() => {
    if (!nameSubmitted) return;

    socket.emit('join_room', { roomId, username });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('start_game', () => {
      navigate(`/room/${roomId}/play`);
    });

    socket.on('update_players', (updatedList) => {
      setPlayers(updatedList);
    });

    socket.on('room_closed', () => {
      setRoomClosed(true);
    });

    return () => {
      socket.off('receive_message');
      socket.off('start_game');
      socket.off('update_players');
      socket.off('room_closed');
    };
  }, [roomId, username, nameSubmitted, navigate]);

  useEffect(() => {
    socket.on('error_message', (msg) => {
      setError(msg);
    });

    return () => {
      socket.off('error_message');
    };
  }, []);

  useEffect(() => {
      if (!roomId) {
        navigate('/');
        return;
      }
    }, [roomId, navigate]);

  const handleNameSubmit = () => {
    if (username.trim()) {
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('roomId', roomId);
      setNameSubmitted(true);
    }
  };

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('send_message', { room: roomId, message: input });
      setInput('');
    }
  };

  const startGame = () => {
    socket.emit('start_game', roomId);
  };

  if (!nameSubmitted) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Enter your name to join the room</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <button onClick={handleNameSubmit} style={{ marginLeft: '10px' }}>
          Join
        </button>
      </div>
    );
  }

  if (roomClosed) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>The host has left. The room is now closed.</h2>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <h2>Waiting Room for: {roomId}</h2>
      <p>Share this link to invite: <b>{window.location.href}</b></p>

      <div>
        <h3>Players in room:</h3>
        <ul>
          {players.map((player, idx) => (
            <li key={idx}>{player}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{
          maxHeight: '200px',
          overflowY: 'scroll',
          border: '1px solid gray',
          padding: '10px'
        }}>
          {messages.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
        {/* 
      <button 
        onClick={startGame} 
        disabled={players.length !== 4}
        style={{
          marginTop: '10px',
          backgroundColor: players.length !== 4 ? 'gray' : 'green',
          color: 'white',
          cursor: players.length !== 4 ? 'not-allowed' : 'pointer',
          padding: '10px',
          fontSize: '16px'
        }}
      >
        Start Game
      </button>
      */}

      <button 
        onClick={startGame} 
      >
        Start Game
      </button>
    </div>
  );
}
