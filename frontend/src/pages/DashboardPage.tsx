import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

interface TokenPayload {
  email?: string
  sub: string
}

interface Upload {
  shortLink: string
  fileName: string
  deleteToken: string
  expiresAt: string
}

export default function DashboardPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const token = localStorage.getItem('accessToken')
  const user = token ? jwtDecode<TokenPayload>(token) : null

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const fetchUploads = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/uploads`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error('Failed to fetch uploads')

        const data = await res.json()
        setUploads(data.uploads || [])
      } catch (err) {
        setError('Unable to load uploads')
      } finally {
        setLoading(false)
      }
    }

    fetchUploads()
  }, [token])

  const handleDelete = async (shortLink: string, deleteToken: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/uploads/${shortLink}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Delete-Token': deleteToken,
          },
        }
      )

      if (!res.ok) throw new Error('Failed to delete')

      setUploads((prev) => prev.filter((u) => u.shortLink !== shortLink))
    } catch (err) {
      alert('Delete failed.')
    }
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Your Uploads</h1>

      {user && (
        <p className="text-sm text-gray-600 mb-4">
          Logged in as: {user.email || user.sub}
        </p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : uploads.length === 0 ? (
        <p className="text-gray-600">No uploads yet.</p>
      ) : (
        <ul className="space-y-3">
          {uploads.map((u) => (
            <li
              key={u.shortLink}
              className="p-3 bg-white shadow rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{u.fileName}</p>
                <a
                  href={u.shortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm underline"
                >
                  {u.shortLink}
                </a>
                <p className="text-xs text-gray-500">
                  Expires: {new Date(u.expiresAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(u.shortLink, u.deleteToken)}
                className="text-red-600 hover:underline text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
