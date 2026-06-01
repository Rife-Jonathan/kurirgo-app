import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Landing() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated && user) {
    return <Navigate to={"/" + (user.role.toLowerCase()) + "/dashboard"} replace />;
  }
  
  return <Navigate to="/login" replace />;
}
