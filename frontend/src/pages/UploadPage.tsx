import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { EyeIcon, EyeSlashIcon, XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'

interface TokenPayload {
  email?: string
  sub: string
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [shortLink, setShortLink] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState(24)
  const [copied, setCopied] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)


  const token = localStorage.getItem('accessToken')
  const user = token ? jwtDecode<TokenPayload>(token) : null
  const navigate = useNavigate()

  const handleUpload = async () => {
    if (files.length === 0) return setError('Please select at least one file to upload.')
    if (files.length > 5) return setError('You can only upload up to 5 files.')
    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    if (totalSize > 30 * 1024 * 1024) return setError('Total upload size must not exceed 30 MB.')

    setUploading(true)
    setError('')
    setShortLink('')
    setUploadProgress(null)

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
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

      xhr.onload = () => {
        setUploading(false)
        setUploadProgress(null)
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          setShortLink(data.shortLink)
          const code = data.shortLink.split('/').pop()
          setShortCode(code || '')
        } else {
          setError('Upload failed. Please try again.')
        }
      }

      xhr.onerror = () => {
        setUploading(false)
        setUploadProgress(null)
        setError('Upload error occurred.')
      }

      xhr.send(formData)
    } catch {
      setUploading(false)
      setUploadProgress(null)
      setError('Unexpected error occurred during upload.')
    }
  }

  const handleFileSelection = (selectedFiles: File[]) => {
    if (selectedFiles.length + files.length > 5) return setError('You can only upload up to 5 files total.')
    const combined = [...files, ...selectedFiles]
    const totalSize = combined.reduce((acc, file) => acc + file.size, 0)
    if (totalSize > 30 * 1024 * 1024) return setError('Total upload size must not exceed 30 MB.')
    setFiles(combined)
    setError('')
    setShortLink('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold text-center">Upload Files</h2>

        {user ? (
          <div className="text-sm text-center text-gray-600">
            Logged in as: {user.email || user.sub}
            <button
              onClick={() => {
                localStorage.removeItem('accessToken')
                navigate('/login')
              }}
              className="ml-4 text-blue-600 hover:underline"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="text-sm text-center text-gray-600">
            <p>Want to manage your uploads later?</p>
            <div className="mt-2 flex justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        <div
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 cursor-pointer hover:border-blue-500 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFileSelection(Array.from(e.dataTransfer.files))
          }}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <p className="text-gray-600">Drag & drop files here or click to browse</p>
          <input
            id="fileInput"
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : []
              handleFileSelection(selected)
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="text-sm text-gray-700 space-y-2">
            <h3 className="font-medium">Selected files:</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={file.name}
                  className="flex justify-between items-center border px-3 py-2 rounded bg-white shadow-sm"
                >
                  <span>{file.name} — {formatBytes(file.size)}</span>
                  <button
                    onClick={() => {
                      const updated = [...files]
                      updated.splice(index, 1)
                      setFiles(updated)
                    }}
                    className="text-sm px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="font-medium">
              Total size: {formatBytes(files.reduce((acc, file) => acc + file.size, 0))}
            </p>
          </div>
        )}

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (Optional)
              </label>

              {/* Dummy hidden fields to confuse autofill */}
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
          onClick={handleUpload}
          disabled={uploading || !!error || files.length === 0}
          className={`w-full py-2 rounded font-medium text-white transition ${
            uploading || !!error || files.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading
            ? 'Uploading...'
            : files.length === 0
              ? 'Add files to upload'
              : 'Upload'}
        </button>

        {uploadProgress !== null && (
          <div className="w-full">
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

        {shortLink && (
          <div className="p-4 bg-green-100 text-green-800 rounded-md text-sm text-center space-y-2">
            <p>Upload successful!</p>
            <div className="flex items-center justify-center gap-2 break-all">
              <a
                href={shortLink}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {shortLink}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shortLink)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                aria-label="Copy link"
                className="p-1 rounded-full hover:bg-gray-200 transition active:scale-95"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <ClipboardIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        )}

        {shortCode && (
          <div className="flex flex-col items-center mt-4 space-y-2">
            <img
              src={`${import.meta.env.VITE_API_BASE}/${shortCode}/qr`}
              alt="QR Code"
              className="w-32 h-32 border rounded"
            />
            <p className="text-sm text-gray-600">Scan to download</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-md text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
