// GameAlreadyStarted.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function GameAlreadyStarted() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Game Already Started</h1>
      <p>Sorry, you can't join this room because the game has already started.</p>
      <Link to="/" style={{ marginTop: "20px", display: "inline-block", fontSize: "18px" }}>
        Go Back to Home
      </Link>
    </div>
  );
}
