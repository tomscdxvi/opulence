// WaitingRoom.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../../util/socket';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

import backgroundImage from '../../assets/pages/background.jpg';

import ChatPop from '../../assets/sounds/pop.wav';
import JoinPop from '../../assets/sounds/join.wav';

// TODO: Separate the Message Box and PLayers in room from hte waiting room for ... and share this link etc... so it doesn't resize it

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

  const [isHost, setIsHost] = useState(false);

  const [roomCodeVisible, setRoomCodeVisible] = useState(true);
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  useEffect(() => {
    socket.emit("check_room_status", { roomId }, (response) => {
      if (response?.error === "game_already_started") {
        navigate("/game-already-started");
      }
    });
  }, []);

  // useEffect(() => {
  //   const savedName = sessionStorage.getItem('username');
  //   const savedRoom = sessionStorage.getItem('roomId');

  //   if (savedName && savedRoom === roomId) {
  //     setUsername(savedName);
  //     setNameSubmitted(true); // this will trigger the main socket logic
  //   }
  // }, [roomId]);

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
        navigate("/room-locked"); 
        return;
      }
    });

    socket.on('host_status', (isHost) => {
      setIsHost(isHost);
    });

    socket.on('room_lock_status', (locked) => {
      setIsRoomLocked(locked);
    });

    socket.on('receive_message', ({ sender, text }) => {
      setMessages((prev) => [...prev, { 
        sender, 
        text,
        timestamp: new Date().toLocaleTimeString(), // capture at time of arrival
      }]);

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
      socket.off('host_status');
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

  if(!nameSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
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

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '40px',
            width: '100%',
            maxWidth: '400px',
            height: '150px',
            zIndex: 10,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            color: '#2C3A47',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Enter your name to join</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            style={{
              padding: '12px',
              width: '60%',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#2C3A47',
              fontSize: '16px',
              marginRight: '10px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNameSubmit();
              }
            }}
          />
          <button
            onClick={handleNameSubmit}
            style={{
              padding: '12px 20px',
              backgroundColor: '#2C3A47',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#596275')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#2C3A47')}
          >
            Join
          </button>
        </motion.div>
      </motion.div>
    )
  }

  if(roomClosed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100%',
          height: '100vh',
          background: 'linear-gradient(to top right, #f3f4f6, #9ca3af)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          textAlign: 'center',
          color: '#111',
        }}
      >
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>The host has left. The room is now closed.</h2>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
          >
            Return to Home
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {isReconnecting && (
        <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
          <div>
            <h2 style={{ color: '#2C3A47' }}>Reconnecting to server...</h2>
          </div>
        </div>
      )}

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: '1000px',
            height: '500px',
            color: '#2C3A47',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
              Waiting Room for:
              {roomCodeVisible ? ` ${roomId}` : ' [Hidden]'}
              <span
                onClick={() => setRoomCodeVisible(prev => !prev)}
                style={{
                  cursor: 'pointer',
                  marginLeft: '10px',
                  fontSize: '18px',
                  verticalAlign: 'middle'
                }}
              >
                {roomCodeVisible ? <FaEyeSlash /> : <FaEye />}
              </span>
            </h2>
            <p style={{ fontSize: '14px', marginBottom: '4px' }}>
              Share this link to invite:
              <b style={{ marginLeft: '4px' }}>
                {roomCodeVisible ? window.location.href : '[Hidden]'}
              </b>
            </p>
            <p style={{ color: isRoomLocked ? '#d63031' : '#00b894', fontWeight: 'bold' }}>
              {isRoomLocked ? 'Room is locked — no new players can join' : 'Room is open'}
            </p>
          </div>


          <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
            {/* Players in Room */}
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '12px' }}>Players in room:</h3>
              <ul style={{ paddingLeft: '20px', listStyle: 'none' }}>
                {players.map((player, idx) => (
                  <li key={idx}>{player}</li>
                ))}
              </ul>
            </div>

            {/* Chat box */}
            <div style={{ flex: 2 }}>
              <div
                style={{
                  height: '200px',
                  maxWidth: '700px',
                  overflowY: 'auto',
                  wordBreak: 'break-all',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#fdfdfd',
                  fontSize: '14px',
                  color: '#2C3A47'
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'left',
                      marginBottom: '8px',
                      padding: '12px 12px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #eee',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      [{msg.timestamp}]
                    </span>
                    <strong> {msg.sender}:</strong> {msg.text}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
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
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    backgroundColor: '#2d3436',
                    color: '#fff',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#636e72')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#2d3436')}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMuted((prev) => !prev)}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              backgroundColor: '#eee',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? '🔇 Muted' : '🔊 Sound On'}
          </button>

          {isHost && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button
                onClick={startGame}
                style={{
                  backgroundColor: '#4f46e5',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#4338ca')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#4f46e5')}
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
                  backgroundColor: isRoomLocked ? '#d63031' : '#00b894',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = isRoomLocked ? '#ff7675' : '#55efc4')
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = isRoomLocked ? '#d63031' : '#00b894')
                }
              >
                {isRoomLocked ? '🔒' : '🔓'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
