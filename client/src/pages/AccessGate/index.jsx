// AccessGate.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessGate() {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

    const correctCode = import.meta.env.VITE_ACCESS_CODE;

  const handleSubmit = () => {
    if (inputCode === correctCode) {
      sessionStorage.setItem('hasAccess', 'true');
      navigate('/'); // to the Lobby
    } else {
      setError('Incorrect code');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Enter Access Code</h2>
      <input
        type="password"
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        placeholder="Access Code"
      />
      <button onClick={handleSubmit} style={{ marginLeft: '10px' }}>Enter</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
