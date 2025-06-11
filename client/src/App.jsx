// App.jsx

import { Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import WaitingRoom from './pages/WaitingRoom';
import GameRoom from './pages/GameRoom';
import RoomNotFound from './pages/RoomNotFound'
import GameAlreadyStarted from './pages/GameAlreadyStarted';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room-not-found" element={<RoomNotFound />} />
      <Route path="/game-already-started" element={<GameAlreadyStarted />} />
      <Route path="/room/:roomId/waiting" element={<WaitingRoom />} />
      <Route path="/room/:roomId/play" element={<GameRoom />} />
    </Routes>
  );
}

// Enable for production
// App.jsx
// import { Routes, Route } from 'react-router-dom';
// import AccessGate from './pages/AccessGate';
// import Lobby from './pages/Lobby';
// import WaitingRoom from './pages/WaitingRoom';
// import GameRoom from './pages/GameRoom';
// import ProtectedRoute from './util/ProtectedRoute';
// import RoomNotFound from './pages/RoomNotFound'
// import GameAlreadyStarted from './pages/GameAlreadyStarted';

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/room-not-found" element={<RoomNotFound />} />
//       <Route path="/game-already-started" element={<GameAlreadyStarted />} />
//       <Route path="/gate" element={<AccessGate />} />
//       <Route
//         path="/"
//         element={
//           <ProtectedRoute>
//             <Lobby />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/room/:roomId/waiting"
//         element={
//           <ProtectedRoute>
//             <WaitingRoom />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/room/:roomId/play"
//         element={
//           <ProtectedRoute>
//             <GameRoom />
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// }
