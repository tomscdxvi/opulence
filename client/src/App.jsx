// App.jsx
import { Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import WaitingRoom from './pages/WaitingRoom';
import GameRoom from './pages/GameRoom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room/:roomId/waiting" element={<WaitingRoom />} />
      <Route path="/room/:roomId/play" element={<GameRoom />} />
    </Routes>
  );
}
