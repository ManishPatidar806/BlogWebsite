import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../ui/LoadingScreen'

export default function ProtectedRoute({ requiredRole = null }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole) {
    const hasRole = requiredRole === 'admin' 
      ? user?.role === 'admin'
      : user?.role === requiredRole || user?.role === 'admin'
    
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
