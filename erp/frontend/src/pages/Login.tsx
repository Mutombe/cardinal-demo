import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Building2, Shield, BarChart3, AlertTriangle } from 'lucide-react'
import { AxiosError } from 'axios'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/api'
import { prefetchAllCoreData } from '../hooks/usePrefetch'
import { useThemeEffect } from '../hooks/useThemeEffect'
import toast from 'react-hot-toast'
import { SiFsecure } from "react-icons/si";
import { PiBuildingApartmentLight } from "react-icons/pi";
import { PiUsersFour } from "react-icons/pi";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { TbChartInfographic } from "react-icons/tb";


const features = [
  { icon: PiBuildingApartmentLight, label: 'Property Management' },
  { icon: SiFsecure, label: 'Multi-tenant Security' },
  { icon: TbChartInfographic, label: 'Financial Reports' },
]

export default function Login() {
  useThemeEffect()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { setUser, isAuthenticated, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'tenant_portal' ? '/portal' : '/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Check if redirected from demo expiry
  const demoExpired = location.state?.demoExpired

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authApi.login(form)
      const loggedInUser = response.data.user
      console.log('[LOGIN] response user:', {
        email: loggedInUser?.email,
        role: loggedInUser?.role,
        tenant_info: loggedInUser?.tenant_info,
        schema_name: loggedInUser?.tenant_info?.schema_name,
      })
      setUser(loggedInUser)

      // Store tenant subdomain for API routing (critical for production
      // where frontend/backend are on different domains)
      const schemaName = loggedInUser?.tenant_info?.schema_name
      console.log('[LOGIN] schema_name:', schemaName, '| storing in sessionStorage:', schemaName && schemaName !== 'public')
      if (schemaName && schemaName !== 'public') {
        sessionStorage.setItem('tenant_subdomain', schemaName)
      }

      // Show demo warning if applicable
      if (response.data.demo_warning) {
        toast.success('Welcome! Your demo session is active.', { duration: 5000 })
      } else {
        toast.success('Welcome back!')
      }

      // Prefetch all core data so pages load instantly after login
      if (loggedInUser?.role !== 'tenant_portal') {
        prefetchAllCoreData(queryClient)
      }

      // Redirect tenant portal users to /portal
      if (loggedInUser?.role === 'tenant_portal') {
        navigate('/portal')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      const axiosErr = error as AxiosError<{ error?: string; demo_expired?: boolean }>
      // Handle different error cases with user-friendly messages
      const errorData = axiosErr.response?.data
      let errorMessage = 'Login failed. Please try again.'

      if (axiosErr.response?.status === 400) {
        // Validation errors
        errorMessage = errorData?.error || 'Invalid email or password'
      } else if (axiosErr.response?.status === 403) {
        // Check for demo expiry
        if (errorData?.demo_expired) {
          errorMessage = 'Your demo has expired. Please contact our sales team to activate your account.'
        } else {
          errorMessage = errorData?.error || 'Access denied. Please check your credentials.'
        }
      } else if (axiosErr.response?.status === 404) {
        errorMessage = 'Service unavailable. Please try again later.'
      } else if (axiosErr.response?.status && axiosErr.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (!axiosErr.response) {
        errorMessage = 'Network error. Please check your connection.'
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: '#ffffff' }} />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#ffffff' }} />
        </div>
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/cardinal-logo-white.svg"
              alt="Cardinal Properties"
              className="h-9 w-auto"
            />
            <div className="border-l border-white/30 pl-3">
              <p className="text-primary-100 text-xs uppercase tracking-widest">Developer Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-serif text-5xl font-medium text-white leading-[1.05]">
              Land development,<br />
              managed end to end.
            </h2>
            <p className="text-primary-200 mt-4 text-lg max-w-md">
              Stand inventory, buyers, purchase agreements and installments — bundled with trust accounting and live sales dashboards for Cardinal Properties.
            </p>
          </motion.div>

          <div className="flex gap-6 mt-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-primary-300 text-sm">
          © {new Date().getFullYear()} Cardinal Properties (Pvt) Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/cardinal-logo-maroon.svg" alt="Cardinal Properties" className="mx-auto mb-2 h-9 w-auto" />
            <p className="text-gray-500 text-sm">Developer ERP</p>
          </div>

          {/* Demo Expired Notice */}
          {demoExpired && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Demo Session Expired</p>
                <p className="text-sm text-amber-700">
                  Your demo session has ended. Contact our sales team to activate your account.
                </p>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 p-8 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
            <div className="mb-8">
              <h2 className="font-serif text-4xl font-medium text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to the Cardinal developer platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:placeholder:text-slate-500"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:placeholder:text-slate-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-gray-400 text-sm">
              Secured by enterprise-grade encryption
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://cardinalproperties.co.zw"
                className="text-primary-700 hover:text-primary-800 font-medium"
              >
                cardinalproperties.co.zw
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
