// App.jsx
import { Routes, Route } from 'react-router-dom';
import AccessGate from './pages/AccessGate';
import Lobby from './pages/Lobby';
import WaitingRoom from './pages/WaitingRoom';
import GameRoom from './pages/GameRoom';
import ProtectedRoute from './util/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/gate" element={<AccessGate />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomId/waiting"
        element={
          <ProtectedRoute>
            <WaitingRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomId/play"
        element={
          <ProtectedRoute>
            <GameRoom />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
