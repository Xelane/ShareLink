import { useState, useRef, useEffect } from 'react'
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'
import UserPool from '../utils/UserPool'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Layout from '../components/Layout'

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

  useEffect(() => {
    if (!error) return;

    const timeout = setTimeout(() => {
      setError('');
    }, 3000); // clear after 3 seconds

    return () => clearTimeout(timeout); // cleanup on next render
  }, [error]);

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
    <Layout>
      <div className="w-full max-w-md bg-[var(--bg-color)] text-[var(--text-color)] p-6 rounded-xl shadow-lg space-y-6 border border-[var(--color-mid)]">
        <h2 className="text-2xl font-semibold text-center">
          {forgotMode ? 'Reset Password' : 'Login'}
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            ref={emailInputRef}
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!forgotMode && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full px-3 py-2 pr-10 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)]"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-mid)] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-[var(--text-color)]" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-[var(--text-color)]" />
                )}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-[var(--text-subtle)]">{info}</p>}

          {forgotMode ? (
            <>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brandl)] text-white font-medium rounded transition cursor-pointer"
              >
                Send Reset Email
              </button>
              <p
                className="text-center text-sm text-[#2563eb] hover:text-[#0e43d6] underline cursor-pointer"
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
                className="w-full py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brandl)] text-white font-medium rounded transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p className="text-center text-sm">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setForgotMode(true)
                    setInfo('')
                    setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setForgotMode(true)
                      setInfo('')
                      setError('')
                    }
                  }}
                  className="cursor-pointer font-medium underline text-[#2563eb] hover:text-[#0e43d6] transition"
                >
                  Forgot password?
                </span>
              </p>

              <p className="text-center text-sm text-[var(--text-subtle)]">
                Don’t have an account?{' '}
                <a
                  href="/signup"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/signup')
                  }}
                  className="!underline"
                >
                  Sign Up
                </a>
              </p>
            </>
          )}
        </form>
      </div>
    </Layout>
  )
}
