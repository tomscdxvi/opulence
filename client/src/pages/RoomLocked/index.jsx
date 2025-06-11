import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoomLocked() {
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
        <h2>This room is locked and no new players can join.</h2>
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
