import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoomNotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      textAlign: 'center',
      padding: '20px',
    }}>
      <h1>Room Not Found</h1>
      <p>The room you are trying to access does not exist or has been closed.</p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          borderRadius: '5px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
        }}
      >
        Return to Home
      </button>
    </div>
  );
}
