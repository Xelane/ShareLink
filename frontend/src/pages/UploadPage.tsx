import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

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
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState(24)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)


  const token = localStorage.getItem('accessToken')
  const user = token ? jwtDecode<TokenPayload>(token) : null    
  const navigate = useNavigate()

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload.')
      return
    }

    if (files.length > 5) {
      setError('You can only upload up to 5 files.')
      return
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    if (totalSize > 30 * 1024 * 1024) {
      setError('Total upload size must not exceed 30 MB.')
      return
    }

    setUploading(true)
    setError('')
    setShortLink('')
    setUploadProgress(null)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('expiryHours', expiry.toString())
      if (password) {
        formData.append('password', password)
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${import.meta.env.VITE_API_BASE}/upload`)

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

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
    } catch (err) {
      setUploading(false)
      setUploadProgress(null)
      setError('Unexpected error occurred during upload.')
    }
  }

  const handleFileSelection = (selectedFiles: File[]) => {
    if (selectedFiles.length + files.length > 5) {
      setError('You can only upload up to 5 files total.')
      return
    }

    const combinedFiles = [...files, ...selectedFiles]
    const totalSize = combinedFiles.reduce((acc, file) => acc + file.size, 0)
    if (totalSize > 30 * 1024 * 1024) {
      setError('Total upload size must not exceed 30 MB.')
      return
    }

    setFiles(combinedFiles)
    setError('')
    setShortLink('')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-semibold mb-4">Upload your file</h1>

      {user ? (
        <p className="text-sm text-gray-600 mb-2">
          Logged in as: {user.email || user.sub}
        </p>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">
            Want to manage your uploads later?
          </p>
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
        </div>
      )}

      {user && (
        <button
          onClick={() => {
            localStorage.removeItem('accessToken')
            navigate('/login')
          }}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          Log out
        </button>
      )}

      <div
        className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-blue-400 transition"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const dropped = Array.from(e.dataTransfer.files)
          handleFileSelection(dropped)
        }}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <p className="text-gray-500">Drag & drop files here or click to browse</p>
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
        <div className="mt-4 w-full max-w-md text-sm text-gray-700">
          <h3 className="font-semibold mb-2">Selected files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={file.name}
                className="flex justify-between items-center border px-3 py-2 rounded bg-gray-50"
              >
                <span>
                  {file.name} — {formatBytes(file.size)}
                </span>
                <button
                  onClick={() => {
                    const updated = [...files]
                    updated.splice(index, 1)
                    setFiles(updated)
                  }}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-medium">
            Total size:{" "}
            {formatBytes(files.reduce((acc, file) => acc + file.size, 0))}
          </p>
        </div>
      )}

      <div className="w-full max-w-md mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password (Optional)
        </label>
        <input
          type="password"
          className="w-full px-3 py-2 border rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave blank for no password"
        />
      </div>

      <div className="w-full max-w-md mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expiry Time (hours)
        </label>
        <select
          className="w-full px-3 py-2 border rounded-md"
          value={expiry}
          onChange={(e) => setExpiry(parseInt(e.target.value))}
        >
          {[1, 6, 12, 24, 48, 72, 168].map((h) => (
            <option key={h} value={h}>
              {h} hour{h !== 1 && 's'}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !!error || files.length === 0}
        className={`px-6 py-2 rounded text-white ${
          uploading || !!error || files.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {uploadProgress !== null && (
        <div className="w-full max-w-md mt-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 w-full max-w-md text-sm text-gray-700">
          <h3 className="font-semibold mb-2">Selected files:</h3>
          <ul className="list-disc list-inside space-y-1">
            {files.map((file) => (
              <li key={file.name}>
                {file.name} — {formatBytes(file.size)}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-medium">
            Total size:{" "}
            {formatBytes(files.reduce((acc, file) => acc + file.size, 0))}
          </p>
        </div>
      )}


      {shortLink && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded">
          Upload successful! Your link:{' '}
          <a
            href={shortLink}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortLink}
          </a>
        </div>
      )}

      {shortLink && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded max-w-md w-full">
          <p className="mb-2">
            Upload successful! Your link: <br />
            <a
              href={shortLink}
              className="underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortLink}
            </a>
          </p>
          <button
            className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigator.clipboard.writeText(shortLink)}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
