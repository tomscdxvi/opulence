import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import backgroundImage from '../../assets/pages/background.jpg';

export default function RoomNotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(to top right, #f9fafb, #e5e7eb, #d1d5db)',
      color: '#2C3A47'
    }}>
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
            maxWidth: '600px',
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
            Room Not Found
          </motion.h1>

          <div>
            <p>The room you are trying to access does not exist or has been closed.</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: '#2C3A47',
                color: 'white',
                padding: '10px 24px',
                marginTop: '12px',
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
              Return to Home
            </button>
          </div>
        </motion.div>
    </div>
  );
}
