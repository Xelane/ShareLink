import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

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
    axios.get(`${import.meta.env.VITE_API_BASE}/info/${shortCode}`)
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
    return <div className="min-h-screen flex items-center justify-center text-red-600 dark:text-red-400">{fatalError}</div>
  }

  if (!fileInfo) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#242424] text-black dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold text-center">Download File</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">File:</span> {fileInfo.fileNames?.[0]}</p>
          <p><span className="font-medium">Size:</span> {formatBytes(fileInfo.fileSizes?.[0] || 0)}</p>
          <p><span className="font-medium">Downloads:</span> {fileInfo.downloadCount}</p>
        </div>

        {fileInfo.passwordProtected && !fileInfo.expired &&(
          <input
            type="password"
            className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        {fileInfo.expired ? (
          <p className="text-red-500 font-medium">This link has expired.</p>
        ) : (
          <p>
            <span className="font-medium">Expires in:</span> {fileInfo.expiresInHours} hour{fileInfo.expiresInHours !== 1 && 's'}
          </p>
        )}

        {fileInfo.expired ? null : (
        <img
          src={`${import.meta.env.VITE_API_BASE}/${shortCode}/qr`}
          alt="QR Code"
          className="w-32 h-32 mt-6 border rounded"
        />
        )}

        {fileInfo.expired ? null : (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition disabled:opacity-50"
          >
            {downloading ? 'Preparing download...' : 'Download'}
          </button>
        )}

        {inlineError && (
          <p className="text-sm text-red-500 text-center">{inlineError}</p>
        )}
      </div>
    </div>
  )
}
