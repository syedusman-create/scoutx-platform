import React, { useEffect, useState } from 'react'

import { uploadMediaApi } from '../../api/uploads.api'

const videoMaxSeconds = 60

export default function Composer({ onSubmit }) {
  const [body, setBody] = useState('')
  const [mode, setMode] = useState('text_plus_media') // text | image | video | text_plus_media
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoDuration, setVideoDuration] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const acceptAttr =
    mode === 'image'
      ? 'image/*'
      : mode === 'video'
        ? 'video/*'
        : 'image/*,video/*'

  const pickModeHelp = () => {
    if (mode === 'text') return 'Text only'
    if (mode === 'image') return 'Image + caption'
    if (mode === 'video') return '1-minute video + caption'
    return 'Text + optional media (image/video)'
  }

  const validateVideoDuration = async (videoUrl, maxSeconds) => {
    const duration = await new Promise((resolve, reject) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => resolve(v.duration)
      v.onerror = () => reject(new Error('Could not read video metadata'))
      v.src = videoUrl
    })
    if (!Number.isFinite(duration)) throw new Error('Invalid video duration')
    if (duration > maxSeconds) throw new Error(`Video must be <= ${maxSeconds}s. Selected: ${Math.round(duration)}s.`)
    return duration
  }

  const handleFileChange = async (nextFile) => {
    setUploadError('')
    setVideoDuration(null)
    setFile(null)

    if (!nextFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
      return
    }

    const url = URL.createObjectURL(nextFile)
    setPreviewUrl(url)
    setFile(nextFile)

    const mime = nextFile.type || ''
    const isVideo = mime.startsWith('video/')
    if (mode === 'video' || (mode === 'text_plus_media' && isVideo) || mode === 'video') {
      try {
        const d = await validateVideoDuration(url, videoMaxSeconds)
        setVideoDuration(d)
      } catch (e) {
        setUploadError(e?.message || 'Video duration validation failed')
        setFile(null)
        setVideoDuration(null)
        URL.revokeObjectURL(url)
        setPreviewUrl('')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploadError('')
    if (!body.trim()) return

    try {
      if (mode === 'text') {
        await onSubmit({ body })
        setBody('')
        return
      }

      if (!file) {
        if (mode === 'text_plus_media') {
          await onSubmit({ body })
          setBody('')
          return
        }
        setUploadError('Please select an image or video.')
        return
      }

      setUploading(true)
      const resp = await uploadMediaApi(file)
      const { media_url, media_type } = resp.data?.data || {}
      await onSubmit({ body, media_url, media_type })

      setBody('')
      setFile(null)
      setVideoDuration(null)
      setUploadError('')
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    } catch (err) {
      const statusError = err?.response?.data?.error
      const networkError = err?.code === 'ERR_NETWORK' || /ERR_NAME_NOT_RESOLVED/i.test(String(err?.message || ''))
      if (networkError) {
        setUploadError('Upload server is unreachable. Check VITE_API_URL (use http://localhost:5000) and backend server status.')
      } else {
        setUploadError(statusError || err?.message || 'Upload failed')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-display text-xl tracking-wide">New post</div>

          <div className="flex flex-wrap gap-2">
            {[
              { v: 'text', label: 'Text' },
              { v: 'image', label: 'Image' },
              { v: 'video', label: 'Video (<=60s)' },
              { v: 'text_plus_media', label: 'Text + Media' }
            ].map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => {
                  setMode(m.v)
                  setUploadError('')
                  setFile(null)
                  setVideoDuration(null)
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setPreviewUrl('')
                }}
                className={[
                  'rounded-md border px-3 py-2 text-xs font-bold tracking-wide uppercase',
                  mode === m.v ? 'bg-lime text-background border-lime' : 'bg-raised/0 border-edge text-text2 hover:bg-raised/30'
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md bg-raised border border-edge p-3 text-text1 outline-none focus:border-lime"
          placeholder="Share your latest highlight, training update, or open call..."
          rows={3}
        />

        {mode === 'text' ? null : (
          <div className="rounded-xl border border-edge bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-text2 text-xs">{pickModeHelp()}</div>
              <div className="text-text3 text-xs font-mono">
                {mode === 'video' ? 'Max: 60s' : 'Image or video'}
              </div>
            </div>

            <div className="mt-3">
              <input
                type="file"
                accept={acceptAttr}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="w-full text-text2 text-xs"
              />
            </div>

            {uploadError ? <div className="mt-2 text-ember text-sm">{uploadError}</div> : null}

            {previewUrl ? (
              <div className="mt-3">
                {file?.type?.startsWith('image/') ? (
                  <img src={previewUrl} alt="Selected media preview" className="max-h-[200px] rounded-xl border border-edge object-contain bg-background" />
                ) : (
                  <div className="rounded-xl border border-edge bg-surface p-3">
                    <video src={previewUrl} controls className="max-h-[220px] w-full rounded-lg" />
                    {videoDuration !== null ? (
                      <div className="text-text2 text-xs mt-2">Duration: {Math.round(videoDuration)}s</div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-text2 text-xs">
            Tip: captions help clubs shortlist faster. Add a clear role/position + timestamp.
          </div>

          <button type="submit" className="btn-primary w-fit" disabled={uploading || !body.trim()}>
            {uploading ? 'Uploading…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}


