import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { EyeIcon, EyeSlashIcon, XMarkIcon, ClipboardIcon, CheckIcon, CloudArrowUpIcon, ChevronDownIcon  } from '@heroicons/react/24/outline'
import Layout from '../components/Layout'

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
  const [isDragging, setIsDragging] = useState(false);


  const token = localStorage.getItem('accessToken')
  const user = token ? jwtDecode<TokenPayload>(token) : null
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      navigate('/dashboard')
    }
  }, [token])

  useEffect(() => {
    if (!error) return;

    const timeout = setTimeout(() => {
      setError('');
    }, 3000); // clear after 3 seconds

    return () => clearTimeout(timeout); // cleanup on next render
  }, [error]);

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
          
          // Reset fields (add this block)
          setFiles([])
          setPassword('')
          setCopied(false)
          setExpiry(24)
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
    const combined = [...files, ...selectedFiles];

    if (combined.length > 5) {
      setError('You can only upload up to 5 files total.');
      return;
    }

    const totalSize = combined.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 30 * 1024 * 1024) {
      setError('Total upload size must not exceed 30 MB.');
      return;
    }

    setFiles(combined);
    setError('');
    setShortLink('');
  };


  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between min-h-[16rem]">
        {/* Left: Catchphrase */}
        <div className="text-[var(--text-color)] text-center md:text-left space-y-6 max-w-xl ">
          <h1 className="text-6xl font-extrabold leading-tight tracking-tight ">
            share files.
          </h1>
          <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-[var(--color-brand)]">
            fast.
          </h1>
          <p className="text-lg text-[var(--text-subtle)]">
            No sign-up needed. Just drag, drop, and send.
          </p>
        </div>

        {/* Right: Upload card */}
        <div className="w-full md:max-w-xl bg-[var(--bg-color)] rounded-xl p-6 shadow-lg space-y-6 border border-[var(--color-mid)] ">
          <h2 className="text-2xl font-semibold text-[var(--text-color)] text-center flex items-center justify-center gap-2">
            <CloudArrowUpIcon className="h-6 w-6" /> Upload Files
          </h2>
          <div
            className={`
              group w-full h-32 rounded 
              flex flex-col items-center justify-center 
              text-[var(--text-color)] text-center cursor-pointer
              transition-all duration-300
              ${isDragging 
                ? 'border-2 border-solid border-[var(--color-brand)] shadow-[0_0_0.5rem_var(--color-brand)]'
                : 'border-2 border-dashed border-[var(--color-mid)] hover:border-[var(--color-brand)]'}
            `}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelection(Array.from(e.dataTransfer.files));
            }}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <p>Drag & drop files here or click to browse</p>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">
              (Max 5 files, up to 30 MB per upload)
            </p>
            <input
              id="fileInput"
              type="file"
              multiple
              hidden
              onChange={(e) => {
                const selected = e.target.files ? Array.from(e.target.files) : []
                handleFileSelection(selected);
              }}
            />
          </div>
          {files.length > 0 && (
            <div className="text-sm text-[var(--text-color)] space-y-2 ">
              <h3 className="font-medium">Selected files:</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={file.name}
                    className="flex justify-between items-center border px-3 py-2 rounded bg-[var(--bg-color)] shadow-sm "
                  >
                    <span>{file.name} — {formatBytes(file.size)}</span>
                    <button
                      onClick={() => {
                        const updated = [...files]
                        updated.splice(index, 1)
                        setFiles(updated)
                      }}
                      className="p-1 rounded-full hover:bg-[var(--color-mid)] text-[var(--text-color)] transition cursor-pointer"
                    >
                      <XMarkIcon className="w-4 h-4 "/>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between text-sm font-medium text-[var(--text-color)] ">
                <span>
                  Total size: {formatBytes(files.reduce((acc, file) => acc + file.size, 0))} / 30 MB
                </span>
                <span>
                  {files.length} / 5 files
                </span>
              </div>
            </div>
          )}

          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-color)] mb-1 ">
                  Password
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
                    className="w-full px-3 py-2 border rounded-md pr-10 bg-[var(--bg-color)] text-[var(--text-color)] "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="(Optional)"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-mid)] transition-colors duration-300 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-[var(--text-color)] " />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-[var(--text-color)] " />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-color)] mb-1 ">
                  Expiry Time
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)] font-normal appearance-none pr-10 cursor-pointer "
                    value={expiry}
                    onChange={(e) => setExpiry(parseInt(e.target.value))}
                  >
                    {[1, 3, 6, 12, 24, 48, 72, 168].map((h) => (
                      <option key={h} value={h}>
                        {h < 24 ? `${h} hour${h !== 1 ? 's' : ''}` : `${h / 24} day${h !== 24 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-5 w-5 text-[var(--text-color)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none " />
                </div>
              </div>
            </div>
          </form>

          {/* Only show upload button if files are selected */}
          {files.length > 0 && (
            <div className="w-full transition-all duration-300 ease-in-out transform opacity-100 translate-y-0">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`w-full py-2 rounded font-medium text-white transition cursor-pointer ${
                  uploading
                    ? 'bg-[var(--color-mid)] cursor-not-allowed'
                    : 'bg-[var(--color-brand)] hover:bg-[var(--color-brandl)]'
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}

          {uploadProgress !== null && (
            <div className="w-full">
              <div className="bg-[var(--color-mid)]  rounded-full h-4">
                <div
                  className="bg-[var(--color-brandl)] h-4 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-center text-[var(--text-color)]  mt-1">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}

          {shortLink && (
            <div className="p-4 bg-[var(--bg-color2)] text-[var(--text-color)] rounded-md text-sm text-center space-y-2 ">
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
                  className="group relative w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  {/* Hover background */}
                  <div className="absolute inset-0 bg-[var(--color-mid)] opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full z-0" />

                  {/* Icon */}
                  <div className="relative z-10 ">
                    {copied ? (
                      <CheckIcon className="w-5 h-5 text-[var(--text-color)] " />
                    ) : (
                      <ClipboardIcon className="w-5 h-5 text-[var(--text-color)] " />
                    )}
                  </div>
                </button>
              </div>
              {shortCode && (
                <div className="flex flex-col items-center mt-4 space-y-2">
                  <img
                    src={`${import.meta.env.VITE_API_BASE}/${shortCode}/qr`}
                    alt="QR Code"
                    className="w-32 h-32 border rounded"
                  />
                  <p className="text-sm text-[var(--text-subtle)] ">Scan to download</p>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="p-4 bg-[var(--bg-color2)] text-[var(--text-color)] rounded-md text-sm text-center ">
              {error}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
