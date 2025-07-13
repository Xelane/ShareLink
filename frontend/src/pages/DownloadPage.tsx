import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DownloadPage() {
  const { shortCode } = useParams()
  const [fileInfo, setFileInfo] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [inlineError, setInlineError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE}/info/${shortCode}`)
      .then(res => setFileInfo(res.data))
      .catch(() => setFatalError('Invalid or expired link.'))
  }, [shortCode])

  const handleDownload = async () => {
    setInlineError('')
    setDownloading(true)
    try {
      const res = await axios.post<{ downloadUrl: string }>(
        `${import.meta.env.VITE_API_BASE}/${shortCode}/download`,
        password ? { password } : {},
        { responseType: 'json' }
      )
      window.location.href = res.data.downloadUrl
    } catch (err: any) {
      setInlineError('Incorrect password or download failed.')
    } finally {
      setDownloading(false)
    }
  }

  if (fatalError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-red-600 dark:text-red-400">
          {fatalError}
        </div>
      </Layout>
    )
  }

  if (!fileInfo) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="w-full max-w-md bg-[var(--bg-color)] text-[var(--text-color)] p-6 rounded-xl shadow-lg space-y-6 border border-[var(--color-mid)]">
        <h2 className="text-2xl font-semibold text-center">Download File</h2>

       <div className="flex gap-4 items-center bg-[var(--bg-color2)] border border-[var(--color-mid)] rounded-lg p-4">
          <div className="flex-1 space-y-2 text-sm">
            <div>
              <p className="text-[var(--text-subtle)]">File Name</p>
              <p className="font-medium break-words">{fileInfo.fileNames?.[0]}</p>
            </div>
            <div>
              <p className="text-[var(--text-subtle)]">Size</p>
              <p className="font-medium">{formatBytes(fileInfo.fileSizes?.[0] || 0)}</p>
            </div>
            {!fileInfo.expired && (
              <p className="text-xs text-[var(--text-subtle)]">
                Link expires in {fileInfo.expiresInHours} hour{fileInfo.expiresInHours !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {!fileInfo.expired && (
            <img
              src={`${import.meta.env.VITE_API_BASE}/${shortCode}/qr`}
              alt="QR Code"
              className="w-28 h-28 border rounded"
            />
          )}
        </div>
        {fileInfo.passwordProtected && !fileInfo.expired && (
          <p className="text-sm text-[var(--text-subtle)] font-medium">
            This file is password protected
          </p>
        )}
        {fileInfo.passwordProtected && !fileInfo.expired && (
          <input
            type="password"
            className="w-full px-3 py-2 border rounded-md bg-[var(--bg-color)] text-[var(--text-color)]"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {fileInfo.expired ? (
          <p className="text-red-500 font-medium text-center">
            This link has expired.
          </p>
        ) : (
          <>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brandl)] text-white font-medium rounded transition disabled:opacity-50 cursor-pointer"
            >
              {downloading ? 'Preparing download...' : 'Download'}
            </button>

            {inlineError && (
              <p className="text-sm text-red-500 text-center">{inlineError}</p>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
