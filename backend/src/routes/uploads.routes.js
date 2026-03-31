const express = require('express')
const path = require('path')
const os = require('os')
const multer = require('multer')
const fs = require('fs')

const auth = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { uploadMedia } = require('../controllers/uploads.controller')

const tmpDir = path.join(os.tmpdir(), 'scoutx-uploads')

// Ensure the temp directory exists for multer.
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || ''
    cb(null, `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const mime = file.mimetype || ''
  if (mime.startsWith('image/')) return cb(null, true)

  // Keep the list tight for production safety.
  const allowedVideos = ['video/mp4', 'video/quicktime', 'video/webm']
  if (allowedVideos.includes(mime)) return cb(null, true)

  return cb(new Error(`Unsupported file type: ${mime}`))
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

const router = express.Router()

router.post(
  '/media',
  auth,
  requireRole('athlete', 'club', 'scout', 'admin'),
  upload.single('file'),
  uploadMedia
)

module.exports = router

