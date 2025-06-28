import { useState, useRef, useEffect } from 'react'
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'
import UserPool from '../utils/UserPool'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!forgotMode && emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [forgotMode])

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const user = new CognitoUser({ Username: email, Pool: UserPool })
    const authDetails = new AuthenticationDetails({ Username: email, Password: password })

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken()
        localStorage.setItem('accessToken', idToken)
        navigate('/dashboard')
      },
      onFailure: (err) => {
        setError(err.message || 'Login failed.')
        setLoading(false)
      }
    })
  }

  const handleForgotPassword = () => {
    setError('')
    setInfo('')
    if (!email) {
      setError('Please enter your email to reset your password.')
      return
    }

    const user = new CognitoUser({ Username: email, Pool: UserPool })
    user.forgotPassword({
      onSuccess: () => {
        setInfo('If this email is registered, reset instructions have been sent.')
      },
      onFailure: () => {
        setInfo('If this email is registered, reset instructions have been sent.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#242424] text-black dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold text-center">
          {forgotMode ? 'Reset Password' : 'Login'}
        </h2>

        <form onSubmit={handleLogin} className="space-y-3">
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            ref={emailInputRef}
            id="email"
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!forgotMode && (
            <>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full px-3 py-2 pr-10 border rounded dark:bg-gray-700 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setShowPassword((prev) => !prev)
                    }
                  }}
                  tabIndex={0}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full 
                             hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer 
                             transition active:scale-90"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                  )}
                </button>
              </div>
              <div className="mb-2" />
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-green-500">{info}</p>}

          {forgotMode ? (
            <>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
              >
                Send Reset Email
              </button>
              <p
                className="text-center text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                onClick={() => {
                  setForgotMode(false)
                  setInfo('')
                  setError('')
                }}
              >
                Back to Login
              </p>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <p
                className="text-center text-sm text-blue-600 cursor-pointer underline mt-2 hover:text-blue-800"
                onClick={() => {
                  setForgotMode(true)
                  setInfo('')
                  setError('')
                }}
              >
                Forgot password?
              </p>

              <p className="text-center text-sm text-gray-500 mt-2">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                >
                  Sign Up
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
