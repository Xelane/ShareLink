import { useEffect, useState } from 'react'
import {
  CognitoUserAttribute,
  CognitoUser
} from 'amazon-cognito-identity-js'
import UserPool from '../utils/UserPool'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

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
        setSuccessMessage('Signup successful! Please check your email and enter the code below.')
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
    user.confirmRegistration(confirmationCode, true, (err, result) => {
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

    user.resendConfirmationCode((err, result) => {
      if (err) {
        setError(err.message || 'Failed to resend code.')
      } else {
        setSuccessMessage('A new confirmation code has been sent to your email.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#242424] text-black dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold text-center">
          {mode === 'signup' ? 'Sign Up' : 'Verify Email'}
        </h2>

        {mode === 'signup' ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              handleSignup()
            }}
          >
            <input
              autoFocus
              type="email"
              placeholder="Email"
              className={`w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white ${
                email && !isEmailValid ? 'border-red-500' : ''
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && !isEmailValid && (
              <p className="text-xs text-red-500">Invalid email format</p>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white ${
                  password && !isPasswordValid ? 'border-red-500' : ''
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition active:scale-90"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-700 dark:text-white" />
                )}
              </button>
            </div>
            {password && !isPasswordValid ? (
              <p className="text-xs text-red-500 mb-2">
                Must be 8+ chars, include upper/lowercase, number & special character
              </p>
            ) : (
              <div className="mb-2" />
            )}

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              className={`w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white ${
                confirmPassword && !isConfirmMatch ? 'border-red-500' : ''
              }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && !isConfirmMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>

            <p
              className="text-center text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
              onClick={() => {
                setMode('verify')
                setError('')
                setSuccessMessage('')
              }}
            >
              Already signed up? Verify your email
            </p>
          </form>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              handleVerification()
            }}
          >
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="text"
              placeholder="Confirmation Code"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
            />

            <button
              type="button"
              onClick={handleResendCode}
              className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Resend Code
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <p
              className="text-center text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
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

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 underline cursor-pointer hover:text-blue-800"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
