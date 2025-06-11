// WaitingRoom.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../../util/socket';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import ChatPop from '../../assets/sounds/pop.wav';
import JoinPop from '../../assets/sounds/join.wav';



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

  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  const [roomCodeVisible, setRoomCodeVisible] = useState(true);
  const [isRoomLocked, setIsRoomLocked] = useState(false);

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

  const playChatSound = () => {
    if (!isMutedRef.current) {
      const audio = new Audio(ChatPop);
      audio.play().catch(err => {
        console.warn('Sound failed to play:', err);
      });
    }
  };

  const playJoinSound = () => {
    if (!isMutedRef.current) {
      const audio = new Audio(JoinPop);
      audio.play().catch(err => {
        console.warn('Sound failed to play:', err);
      });
    }
  }

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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

      if (response?.error === "room_locked") {
        setError("This room is currently locked.");
        return;
      }
    });

    socket.on('room_lock_status', (locked) => {
      setIsRoomLocked(locked);
    });

    socket.on('receive_message', ({ sender, text }) => {
      setMessages((prev) => [...prev, { sender, text }]);

      // Only play the sound if the message is from someone else
      if (sender !== username && !isMuted) {
        playChatSound();
      }
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

      playJoinSound();
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
      socket.off('room_lock_status');
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
            <h2>
              Waiting Room for: 
              {roomCodeVisible ? ` ${roomId}` : ' [Hidden]'}
              <div
                onClick={() => setRoomCodeVisible(prev => !prev)}
                style={{
                  cursor: 'pointer',
                  fontSize: '18px',
                  userSelect: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: '12px'
                }}
                title={roomCodeVisible ? 'Hide Room Code' : 'Show Room Code'}
              >
                {roomCodeVisible ? <FaEyeSlash /> : <FaEye />}
              </div>
            </h2>

            <p>
              Share this link to invite: 
              <b style={{ marginLeft: 4 }}>
                {roomCodeVisible ? window.location.href : '[Hidden]'}
              </b>
            </p>

            <p style={{ fontWeight: 'bold', color: isRoomLocked ? 'red' : 'green' }}>
              {isRoomLocked ? 'Room is locked — no new players can join' : 'Room is open'}
            </p>
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
              <span><strong>{msg.sender}:</strong> {msg.text}</span>
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

        <button
  onClick={() => setIsMuted((prev) => !prev)}
  style={{
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#eee',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
  }}
>
  {isMuted ? '🔇 Muted' : '🔊 Sound On'}
</button>

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button
              onClick={startGame}
              style={{
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

            <button
              onClick={() => {
                socket.emit('toggle_room_lock', { roomId }, (res) => {
                  if (res?.error) {
                    alert(res.error);
                  } else {
                    setIsRoomLocked(res.locked);
                  }
                });
              }}
              style={{
                padding: '10px 16px',
                fontWeight: 'bold',
                borderRadius: '6px',
                backgroundColor: isRoomLocked ? '#d63031' : '#00b894',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {isRoomLocked ? '🔒' : '🔓'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
