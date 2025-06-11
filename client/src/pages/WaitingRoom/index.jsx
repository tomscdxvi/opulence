// WaitingRoom.jsx

import { useState, useEffect, useRef } from 'react';
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
  const [isReconnecting, setIsReconnecting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("check_room_status", { roomId }, (response) => {
      if (response?.error === "game_already_started") {
        navigate("/game-already-started");
      }
    });
  }, []);

  useEffect(() => {
    const savedName = sessionStorage.getItem('username');
    const savedRoom = sessionStorage.getItem('roomId');

    if (savedName && savedRoom === roomId) {
      setUsername(savedName);
      setNameSubmitted(true); // this will trigger the main socket logic
    }
  }, [roomId]);

  useEffect(() => {
    if (!nameSubmitted) return;

    socket.emit('join_room', { roomId, username }, (response) => {
      if (response?.error === "game_already_started") {
        navigate("/game-already-started");
        return;
      }

      if (response?.error === "room_not_found") {
        navigate("/room-not-found");
        return;
      }
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('start_game', (response) => {
      if (response?.error === 'room_not_found') {
        setRoomClosed(true);
        navigate('/room-not-found');
        return;
      }

      navigate(`/room/${roomId}/play`);
    });

    socket.on('update_players', (updatedList) => {
      setPlayers(updatedList);
    });

    socket.on('room_closed', () => {
      setRoomClosed(true);
      navigate('/room-not-found'); // force exit before start_game can fire
    });

    socket.on('connect', () => {
      console.log('Reconnected to server');
      socket.emit('join_room', { roomId, username }, (response) => {
        if (response?.error === 'room_not_found') {
          navigate('/room-not-found');
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsReconnecting(true);
    });

    socket.io.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
      setIsReconnecting(true);
    });

    socket.io.on('reconnect', () => {
      console.log('Reconnected!');
      setIsReconnecting(false);
    });

    return () => {
      socket.off('receive_message');
      socket.off('start_game');
      socket.off('update_players');
      socket.off('room_closed');
      socket.off('connect');
      socket.off('disconnect');
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect');
    };
  }, [roomId, username, nameSubmitted, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


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
    socket.emit('start_game', roomId, (response) => {
      if (response?.error === 'room_not_found') {
        navigate('/room-not-found');
      }
    });
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
    <>
      {isReconnecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#ffcc00',
          padding: '10px',
          textAlign: 'center',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          Reconnecting to server...
        </div>
      )}

      <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>
          <div style={{ textAlign: 'center' }}>
            <h2>Waiting Room for: {roomId}</h2>
            <p>Share this link to invite: <b>{window.location.href}</b></p>
          </div>

          <div style={{ marginTop: '36px' }}>
            <h3>Players in room:</h3>
            <ul style={{ listStyle: 'number' }}>
              {players.map((player, idx) => (
                <li key={idx}>{player}</li>
              ))}
            </ul>
          </div>

        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            padding: '12px',
            backgroundColor: '#fafafa',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            fontFamily: 'sans-serif',
            fontSize: '14px',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className="message-entry"
              style={{
                padding: '6px 8px',
                marginBottom: '6px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <span style={{ color: '#888', fontSize: '12px', minWidth: '64px' }}>
                [{new Date().toLocaleTimeString()}]
              </span>
              <span>{msg}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>


        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '0 8px',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              outline: 'none',
              transition: 'border 0.2s ease',
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: '10px 16px',
              backgroundColor: '#2d3436',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#636e72')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#2d3436')}
          >
            Send
          </button>
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
            style={{
              width: '100%',
              marginTop: 24,
              padding: '10px 16px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#82589F',
              color: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(108, 92, 231, 0.4)', // purple shadow
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#B33771';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(162, 155, 254, 0.6)'; // lighter purple shadow
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#82589F';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(108, 92, 231, 0.4)';
            }}
          >
            Start Game
          </button>

        </div>
      </div>
    </>
  );
}
