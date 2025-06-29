import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import {
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ClipboardIcon,
  CheckIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface TokenPayload {
  email?: string
  sub: string
}

interface Upload {
  shortCode: string
  fileNames: string[]
  totalSize: number
  createdAt: number
  expiresAt: number
  downloadCount: number
  expired: boolean
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DashboardPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState(24)
  const [successInfo, setSuccessInfo] = useState<{ url: string; qrUrl: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [loadingUploads, setLoadingUploads] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')

  const navigate = useNavigate()
  const token = localStorage.getItem('accessToken')
  const user = token ? jwtDecode<TokenPayload>(token) : null
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const fetchUploads = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/my-uploads`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Failed to fetch uploads')
        const data = await res.json()
        setUploads(data)
      } catch (err) {
        setError('Unable to load uploads')
      } finally {
        setLoadingUploads(false)
      }
    }

    fetchUploads()
  }, [token])

  const handleDelete = async (shortCode: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/link/${shortCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to delete')
      setUploads((prev) => prev.filter((u) => u.shortCode !== shortCode))
    } catch (err) {
      alert('Delete failed.')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setUploadFiles(Array.from(e.dataTransfer.files))
  }

  if (!token) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-2xl space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-sm text-gray-600">Logged in as: {user?.email || user?.sub}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken')
              navigate('/')
            }}
            className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> Logout
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CloudArrowUpIcon className="h-6 w-6" /> Upload Files
          </h2>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 cursor-pointer hover:border-blue-500 transition"
          >
            {uploadFiles.length > 0
              ? `${uploadFiles.length} file(s) selected`
              : 'Drag & drop files here or click to browse'}
            <input
              type="file"
              multiple
              hidden
              ref={fileInputRef}
              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
            />
          </div>
          
          {uploadFiles.length > 0 && (
            <div className="text-sm text-gray-700 space-y-2">
              <h3 className="font-medium">Selected files:</h3>
              <ul className="space-y-2">
                {uploadFiles.map((file, index) => (
                  <li
                    key={file.name}
                    className="flex justify-between items-center border px-3 py-2 rounded bg-white shadow-sm"
                  >
                    <span>{file.name} — {formatBytes(file.size)}</span>
                    <button
                      onClick={() => {
                        const updated = [...uploadFiles]
                        updated.splice(index, 1)
                        setUploadFiles(updated)
                      }}
                      className="text-sm px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="font-medium">
                Total size: {formatBytes(uploadFiles.reduce((acc, file) => acc + file.size, 0))}
              </p>
            </div>
          )}

          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password (Optional)
                </label>

                {/* Dummy fields to prevent autofill */}
                <input
                  type="text"
                  name="dummy-username"
                  autoComplete="username"
                  className="hidden"
                />
                <input
                  type="password"
                  name="dummy-password"
                  autoComplete="new-password"
                  className="hidden"
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    name="upload-password"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute('readOnly')}
                    className="w-full px-3 py-2 border rounded-md pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank for no password"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-700" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-700" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Time
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={expiry}
                  onChange={(e) => setExpiry(parseInt(e.target.value))}
                >
                  {[1, 3, 6, 12, 24, 48, 72, 168].map((h) => (
                    <option key={h} value={h}>
                      {h < 24 ? `${h} hour${h !== 1 ? 's' : ''}` : `${h / 24} day${h !== 24 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          <button
            onClick={() => {
              if (uploadFiles.length === 0) return setUploadError('Please select at least one file to upload.')
              if (uploadFiles.length > 5) return setUploadError('You can only upload up to 5 files.')
              const totalSize = uploadFiles.reduce((acc, file) => acc + file.size, 0)
              if (totalSize > 30 * 1024 * 1024) return setUploadError('Total upload size must not exceed 30 MB.')

              setUploading(true)
              setUploadError('')
              setSuccessInfo(null)
              setUploadProgress(null)

              try {
                const formData = new FormData()
                uploadFiles.forEach((file) => formData.append('files', file))
                formData.append('expiryHours', expiry.toString())
                if (password) formData.append('password', password)

                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${import.meta.env.VITE_API_BASE}/upload`)
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

                xhr.upload.onprogress = (event) => {
                  if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100)
                    setUploadProgress(percent)
                  }
                }

                xhr.onload = async () => {
                  setUploading(false)
                  setUploadProgress(null)
                  if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText)
                    const shortCode = data.shortLink.split('/').pop()
                    setSuccessInfo({
                      url: data.shortLink,
                      qrUrl: `${import.meta.env.VITE_API_BASE}/${shortCode}/qr`,
                    })

                    // Reset fields
                    setUploadFiles([])
                    setPassword('')
                    setCopiedLink(null)
                    setExpiry(24)

                    // Refresh upload history
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_BASE}/my-uploads`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                      if (res.ok) {
                        const refreshed = await res.json()
                        setUploads(refreshed)
                      }
                    } catch {
                      // silently ignore
                    }
                  } else {
                    setUploadError('Upload failed. Please try again.')
                  }
                }

                xhr.onerror = () => {
                  setUploading(false)
                  setUploadProgress(null)
                  setUploadError('Upload error occurred.')
                }

                xhr.send(formData)
              } catch {
                setUploading(false)
                setUploadProgress(null)
                setUploadError('Unexpected error occurred during upload.')
              }
            }}
            disabled={uploading || !!uploadError || uploadFiles.length === 0}
            className={`w-full py-2 rounded font-medium text-white transition ${
              uploading || !!uploadError || uploadFiles.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading
              ? 'Uploading...'
              : uploadFiles.length === 0
                ? 'Add files to upload'
                : 'Upload'}
          </button>
        </div>
        
        {uploadProgress !== null && (
          <div className="w-full mt-2">
            <div className="bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-600 mt-1">
              Uploading: {uploadProgress}%
            </p>
          </div>
        )}

        {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}

        {successInfo && (
          <>
            {/* Green box: ONLY message + link + copy button */}
            <div className="p-4 bg-green-100 text-green-800 rounded-md text-sm text-center space-y-2 w-full">
              <p>Upload successful!</p>
              <div className="flex items-center justify-center gap-2 break-all">
                <a
                  href={successInfo.url}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {successInfo.url}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successInfo.url)
                    setCopiedLink(successInfo.url)
                    setTimeout(() => setCopiedLink(null), 1500)
                  }}
                  aria-label="Copy link"
                  className="p-1 rounded-full hover:bg-gray-200 transition active:scale-95"
                >
                  {copiedLink === successInfo.url ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* QR code: shown below, outside the green box */}
            <div className="flex flex-col items-center mt-4 space-y-2">
              <img
                src={successInfo.qrUrl}
                alt="QR Code"
                className="w-32 h-32 border rounded"
              />
              <p className="text-sm text-gray-600">Scan to download</p>
            </div>
          </>
        )}

        <div className="bg-white rounded-xl p-6 shadow space-y-4">
          <h2 className="text-xl font-semibold">Upload History</h2>
          {loadingUploads ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : uploads.length === 0 ? (
            <p className="text-gray-600">No uploads yet.</p>
          ) : (
            <ul className="space-y-3">
              {uploads.map((u) => {
                const fullLink = `${import.meta.env.VITE_BASE_URL}/${u.shortCode}`
                return (
                  <li
                    key={u.shortCode}
                    className="p-4 bg-gray-100 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    {!u.expired && (
                      <img
                        src={`${import.meta.env.VITE_API_BASE}/${u.shortCode}/qr`}
                        alt="QR Code"
                        className="w-32 h-32 border rounded"
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{u.fileNames[0]}</p>
                      <div className="flex items-center gap-2 break-all">
                        <a
                          href={fullLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm underline"
                        >
                          {fullLink}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(fullLink)
                            setCopiedLink(fullLink)
                            setTimeout(() => setCopiedLink(null), 1500)
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 transition"
                        >
                          {copiedLink === fullLink ? (
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Size: {formatBytes(u.totalSize)} | Downloads: {u.downloadCount}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(u.expiresAt).toLocaleString()} {u.expired && '(Expired)'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(u.shortCode)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 self-start md:self-center"
                    >
                      <TrashIcon className="h-4 w-4" /> Delete
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
