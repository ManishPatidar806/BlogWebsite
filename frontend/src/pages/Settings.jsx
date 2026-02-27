import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  User, Lock, Bell, Palette, Globe,
  Camera, Save, Loader2, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

import { userService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from '../components/ui/Avatar'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile form state
  const [displayName, setDisplayName] = useState(user?.profile?.display_name || '')
  const [bio, setBio] = useState(user?.profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || '')
  const [website, setWebsite] = useState(user?.profile?.website || '')
  const [twitter, setTwitter] = useState(user?.profile?.twitter || '')
  const [github, setGithub] = useState(user?.profile?.github || '')
  
  // Account form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data)
      toast.success('Profile updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile')
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data) => userService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    },
  })

  const handleSaveProfile = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      website: website.trim() || null,
      twitter: twitter.trim() || null,
      github: github.trim() || null,
    })
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-6">
        Settings
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="flex md:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400'
                    : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100 mb-6">
                Profile Settings
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                    Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={avatarUrl}
                      name={user?.username}
                      size="xl"
                    />
                    <div className="flex-1">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="input w-full"
                      />
                      <p className="text-xs text-ink-600 dark:text-ink-400 mt-1">
                        Enter a URL for your avatar image
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display name */}
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user?.username}
                    className="input w-full"
                    maxLength={50}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="input w-full resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-ink-600 dark:text-ink-400 mt-1">
                    {bio.length}/500 characters
                  </p>
                </div>

                {/* Social links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-ink-700 dark:text-ink-300">
                    Social Links
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-600 dark:text-ink-400 mb-1">Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-600 dark:text-ink-400 mb-1">Twitter</label>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="username"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-600 dark:text-ink-400 mb-1">GitHub</label>
                      <input
                        type="text"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="username"
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Account info */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100 mb-4">
                  Account Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-ink-600 dark:text-ink-400 mb-1">Username</label>
                    <p className="text-ink-900 dark:text-ink-100 font-medium">
                      @{user?.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 dark:text-ink-400 mb-1">Email</label>
                    <p className="text-ink-900 dark:text-ink-100 font-medium">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 dark:text-ink-400 mb-1">Role</label>
                    <p className="text-ink-900 dark:text-ink-100 font-medium capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Change password */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100 mb-4">
                  Change Password
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input w-full pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                      New Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input w-full"
                      minLength={8}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="btn-primary flex items-center gap-2"
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100 mb-6">
                Appearance
              </h2>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-4">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setTheme(option)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === option
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                          : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600'
                      }`}
                    >
                      <div className={`w-full h-12 rounded-lg mb-3 ${
                        option === 'light' ? 'bg-white border border-ink-200' :
                        option === 'dark' ? 'bg-ink-900 border border-ink-700' :
                        'bg-gradient-to-r from-white via-white to-ink-900 border border-ink-200'
                      }`} />
                      <p className="text-sm font-medium text-ink-900 dark:text-ink-100 capitalize">
                        {option}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
