import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await api.get('/users/me')
          setUser(response.data)
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login/json', { email, password })
      const { access_token, refresh_token } = response.data
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      // Fetch user data
      const userResponse = await api.get('/users/me')
      setUser(userResponse.data)
      
      toast.success('Welcome back!')
      navigate('/dashboard')
      
      return { success: true }
    } catch (error) {
      let message = 'Login failed'
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0].msg || detail[0].message || 'Validation error'
      }
      toast.error(message)
      return { success: false, error: message }
    }
  }, [navigate])

  const register = useCallback(async (userData) => {
    try {
      await api.post('/auth/register', userData)
      
      // Auto-login after registration
      return await login(userData.email, userData.password)
    } catch (error) {
      let message = 'Registration failed'
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0].msg || detail[0].message || 'Validation error'
      }
      toast.error(message)
      return { success: false, error: message }
    }
  }, [login])

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch (error) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      navigate('/')
      toast.success('Logged out successfully')
    }
  }, [navigate])

  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isWriter: user?.role === 'writer' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
