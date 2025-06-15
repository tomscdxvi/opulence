// AccessGate.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AccessGate() {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const correctCode = import.meta.env.VITE_ACCESS_CODE;

  // Redirect path defaults to "/" if none provided
  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = () => {
    if (inputCode === correctCode) {
      sessionStorage.setItem('hasAccess', 'true');
      navigate(redirectPath, { replace: true });
    } else {
      setError('Incorrect code');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Currently in Testing (Alpha)</h2>
      <h3>Enter Access Code</h3>
      <input
        type="password"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        placeholder="Access Code"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        style={{
          flex: 1,
          padding: '10px 12px',
          marginRight: '12px',
          fontSize: '14px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          backgroundColor: '#fff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          outline: 'none',
          transition: 'border 0.2s ease',
          color: '#2C3A47'
        }}
      />
      <button
        onClick={handleSubmit}
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
        Enter
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
