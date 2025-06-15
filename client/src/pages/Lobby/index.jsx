import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../util/socket';
import { motion } from 'framer-motion';

import backgroundImage from '../../assets/pages/background.jpg';
import backgroundImage2 from '../../assets/pages/background-2.jpg';

export default function Lobby() {
  const navigate = useNavigate();
  const [room, setRoom] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const joinRoom = (e) => {
    e.preventDefault();
    const trimmedRoom = room.trim();
    if (!trimmedRoom) return;

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
    <>

          {/* Scoped style to affect placeholder color */}
      <style>
        {`
          input::placeholder {
            color: '#2C3A47',;
            opacity: 1; /* Optional: Ensures full visibility */
          }
        `}
      </style>

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
            width: '90%',
            maxWidth: '400px',
            color: '#2C3A47',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '24px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              letterSpacing: '1px',
            }}
          >
            Opulence
          </motion.h1>

          <form
            onSubmit={joinRoom}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <input
              type="text"
              placeholder="Enter Room Code"
              value={room}
              onChange={(e) => {
                setRoom(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                width: '60%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#2C3A47',
                border: 'none',
                fontSize: '16px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#2C3A47',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#596275')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#2C3A47')}
            >
              Join Room
            </button>
          </form>

          {errorMessage && (
            <div style={{ color: '#fca5a5', marginTop: '12px' }}>{errorMessage}</div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={createRoom}
              style={{
                color: '#2C3A47',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px',
              }}
              onMouseOver={(e) => (e.target.style.color = '#a5b1c2')}
              onMouseOut={(e) => (e.target.style.color = '#2C3A47')}
            >
              Or create a new room
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
