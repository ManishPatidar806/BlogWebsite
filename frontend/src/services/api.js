import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

// API service functions
export const authService = {
  login: (email, password) => api.post('/auth/login/json', { email, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
}

export const userService = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  updateProfile: (data) => api.put('/users/me/profile', data),
  changePassword: (data) => api.put('/users/me/password', data),
  getStats: () => api.get('/users/me/stats'),
  getProfile: (username) => api.get(`/users/${username}`),
  getUserStats: (username) => api.get(`/users/${username}/stats`),
}

export const postService = {
  getAll: (params) => api.get('/posts', { params }),
  getMyPosts: (params) => api.get('/posts/my', { params }),
  getBookmarks: (params) => api.get('/posts/bookmarks', { params }),
  getBySlug: (slug) => api.get(`/posts/slug/${slug}`),
  getById: (id) => api.get(`/posts/${id}`),
  getByAuthor: (username, params) => api.get(`/posts/author/${username}`, { params }),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  bookmark: (id) => api.post(`/posts/${id}/bookmark`),
  saveDraft: (data) => api.post('/posts/drafts', data),
  getDrafts: (postId) => api.get('/posts/drafts/list', { params: { post_id: postId } }),
  getFeatured: () => api.get('/posts/featured'),
  getRecent: (limit) => api.get('/posts', { params: { limit, sort: 'latest' } }),
}

export const tagService = {
  getAll: () => api.get('/tags'),
  get: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
}

export const categoryService = {
  getAll: () => api.get('/categories'),
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const commentService = {
  getByPost: (postId) => api.get(`/comments/post/${postId}`),
  create: (postId, data) => api.post(`/comments/post/${postId}`, data),
  update: (commentId, data) => api.put(`/comments/${commentId}`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
}

export const aiService = {
  improve: (text) => api.post('/ai/improve', { text }),
  grammar: (text) => api.post('/ai/grammar', { text }),
  rewrite: (text) => api.post('/ai/rewrite', { text }),
  suggestTitles: (content) => api.post('/ai/titles', { content }),
  professional: (text) => api.post('/ai/professional', { text }),
  paraphrase: (text) => api.post('/ai/paraphrase', { text }),
}

export const uploadService = {
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadImages: (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}
