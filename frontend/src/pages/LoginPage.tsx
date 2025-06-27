import { useState } from 'react'
import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserPool,
} from 'amazon-cognito-identity-js'
import { cognitoConfig } from '../awsConfig'
import { useNavigate } from 'react-router-dom'

const poolData = {
  UserPoolId: cognitoConfig.UserPoolId,
  ClientId: cognitoConfig.ClientId,
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    const userPool = new CognitoUserPool(poolData)
    const user = new CognitoUser({ Username: email, Pool: userPool })
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    })

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const accessToken = result.getAccessToken().getJwtToken()
        localStorage.setItem('accessToken', accessToken)
        navigate('/')
      },
      onFailure: (err) => {
        setError(err.message || 'Login failed')
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Login to ShareLink</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 p-2 border rounded w-64"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 p-2 border rounded w-64"
      />

      <button
        onClick={handleLogin}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Log In
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  )
}
