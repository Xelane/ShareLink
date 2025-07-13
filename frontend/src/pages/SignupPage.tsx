import { useEffect, useState } from 'react'
import {
  CognitoUserAttribute,
  CognitoUser
} from 'amazon-cognito-identity-js'
import UserPool from '../utils/UserPool'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Layout from '../components/Layout'

export default function SignupPage() {
  const [mode, setMode] = useState<'signup' | 'verify'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')

  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)


  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem('signupEmail')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)
  const isConfirmMatch = password === confirmPassword && confirmPassword.length > 0

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[\W_]/.test(password)
  const hasMinLength = password.length >= 8
  const allValid = hasUpper && hasLower && hasNumber && hasSpecial && hasMinLength


  const validateAll = (): string | null => {
    if (!isEmailValid) return 'Please enter a valid email address.'
    if (!isPasswordValid)
      return 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters.'
    if (!isConfirmMatch) return 'Passwords do not match.'
    return null
  }

  const handleSignup = () => {
    const validationError = validateAll()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')

    const attributeList = [new CognitoUserAttribute({ Name: 'email', Value: email })]

    UserPool.signUp(email, password, attributeList, [], (err) => {
      setLoading(false)
      if (err) {
        setError(err.message || 'Signup failed.')
      } else {
        setSuccessMessage('Signup successful! Check your email for the confirmation code.')
        localStorage.setItem('signupEmail', email)
        setMode('verify')
      }
    })
  }

  const handleVerification = () => {
    if (!isEmailValid || !confirmationCode) {
      setError('Please provide both email and confirmation code.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')

    const user = new CognitoUser({ Username: email, Pool: UserPool })
    user.confirmRegistration(confirmationCode, true, (err) => {
      setLoading(false)
      if (err) {
        setError(err.message || 'Verification failed.')
      } else {
        localStorage.removeItem('signupEmail')
        setSuccessMessage('Email verified! Redirecting to login...')
        setTimeout(() => navigate('/login'), 1500)
      }
    })
  }

  const handleResendCode = () => {
    setError('')
    setSuccessMessage('')
    if (!isEmailValid) {
      setError('Please enter a valid email.')
      return
    }

    const user = new CognitoUser({ Username: email, Pool: UserPool })
    user.resendConfirmationCode((err) => {
      if (err) {
        setError(err.message || 'Failed to resend code.')
      } else {
        setSuccessMessage('A new confirmation code has been sent to your email.')
      }
    })
  }

  return (
    <Layout>
      <div className="w-full max-w-md bg-[var(--bg-color)] text-[var(--text-color)] p-6 rounded-xl shadow-lg space-y-6 border border-[var(--color-mid)]">
        <h2 className="text-2xl font-semibold text-center">
          {mode === 'signup' ? 'Sign Up' : 'Verify Email'}
        </h2>

        {mode === 'signup' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSignup()
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)] ${
                email && !isEmailValid ? 'border-red-500' : ''
              }`}
              autoFocus
              required
            />
            {email && !isEmailValid && (
              <p className="text-xs text-red-500">Invalid email format</p>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value
                  setPassword(value)

                  const isValidNow =
                    /[A-Z]/.test(value) &&
                    /[a-z]/.test(value) &&
                    /\d/.test(value) &&
                    /[\W_]/.test(value) &&
                    value.length >= 8

                  if (!isValidNow) setShowChecklist(true)
                }}
                onBlur={() => {
                  // Hide checklist if all are valid
                  if (allValid) setShowChecklist(false)
                }}
                className={`w-full px-3 py-2 pr-10 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)] ${
                  password && !isPasswordValid ? 'border-red-500' : ''
                }`}
                required
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-mid)] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-[var(--text-color)]" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-[var(--text-color)]" />
                )}
              </button>
            </div>

            {password && showChecklist && (
              <div className="text-xs mt-2 space-y-1">
                <p className="font-medium text-[var(--text-subtle)]">Password must contain:</p>
                <ul className="space-y-1">
                  {[
                    [hasUpper, 'One uppercase letter'],
                    [hasLower, 'One lowercase letter'],
                    [hasNumber, 'One number'],
                    [hasSpecial, 'One special character'],
                    [hasMinLength, 'Minimum 8 characters'],
                  ].map(([condition, text], idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      {condition ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                      <span className={condition ? 'text-green-600' : 'text-red-500'}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)] ${
                confirmPassword && !isConfirmMatch ? 'border-red-500' : ''
              }`}
              required
            />
            {confirmPassword && !isConfirmMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-[var(--text-subtle)]">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brandl)] text-white font-medium rounded transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>

            <p
              className="text-center text-sm underline cursor-pointer text-[#2563eb] hover:text-[#0e43d6]"
              onClick={() => {
                setMode('verify')
                setError('')
                setSuccessMessage('')
              }}
            >
              Email not verified? Verify here
            </p>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleVerification()
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)]"
              required
            />

            <input
              type="text"
              placeholder="Confirmation Code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)]"
              required
            />

            <button
              type="button"
              onClick={handleResendCode}
              className="w-full py-2 bg-[var(--color-mid)] hover:bg-[var(--text-subtle)] text-[var(--text-color)] rounded transition cursor-pointer"
            >
              Resend Code
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm [var(--text-subtle)]">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brandl)] text-white font-medium rounded transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <p
              className="text-center text-sm underline cursor-pointer text-[#2563eb] hover:text-[#0e43d6]"
              onClick={() => {
                setMode('signup')
                setError('')
                setSuccessMessage('')
              }}
            >
              Back to Sign Up
            </p>
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-subtle)]">
          Already have an account?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault()
              navigate('/login')
            }}
            className="!underline"
          >
            Login
          </a>
        </p>
      </div>
    </Layout>
  )
}
