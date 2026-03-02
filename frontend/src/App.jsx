import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingScreen from './components/ui/LoadingScreen'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Editor = lazy(() => import('./pages/Editor'))
const MyPosts = lazy(() => import('./pages/MyPosts'))
// const Bookmarks = lazy(() => import('./pages/Bookmarks'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

// LMS Course pages
const CourseView = lazy(() => import('./pages/CourseView'))
const CourseManager = lazy(() => import('./pages/CourseManager'))
const LessonManager = lazy(() => import('./pages/LessonManager'))
const LessonEditor = lazy(() => import('./pages/LessonEditor'))

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes with main layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Writer-only routes with dashboard layout */}
        <Route element={<ProtectedRoute requiredRole="writer" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/courses" element={<CourseManager />} />
            <Route path="/courses/:courseId/lessons" element={<LessonManager />} />
            {/* Commented out bookmarks route
            <Route path="/bookmarks" element={<Bookmarks />} />
            */}
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Editor has its own fullscreen layout */}
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:postId" element={<Editor />} />
          
          {/* Lesson Editor - fullscreen layout */}
          <Route path="/courses/:courseId/lessons/new" element={<LessonEditor />} />
          <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<LessonEditor />} />
        </Route>

        {/* LMS Course pages - no main layout */}
        <Route path="/learn/:courseSlug" element={<CourseView />} />
        <Route path="/learn/:courseSlug/:lessonSlug" element={<CourseView />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
