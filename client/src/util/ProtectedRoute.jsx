// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const hasAccess = sessionStorage.getItem('hasAccess') === 'true';

  return hasAccess ? children : <Navigate to="/gate" />;
}
