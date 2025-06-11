// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const hasAccess = sessionStorage.getItem('hasAccess') === 'true';
  const location = useLocation();

  if (!hasAccess) {
    // Send them to /gate but keep track of where they were going
    return <Navigate to="/gate" state={{ from: location }} replace />;
  }

  return children;
}
