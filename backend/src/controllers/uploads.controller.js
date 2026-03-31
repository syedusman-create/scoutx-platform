const fs = require('fs')

const { cloudinary } = require('../config/cloudinary')

const deleteFileQuietly = (filePath) => {
  if (!filePath) return
  fs.unlink(filePath, () => {})
}

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' })
    }

    const mime = req.file.mimetype || ''
    const isImage = mime.startsWith('image/')
    const isVideo = mime.startsWith('video/')

    if (!isImage && !isVideo) {
      deleteFileQuietly(req.file.path)
      return res.status(400).json({ success: false, error: `Unsupported mimetype: ${mime}` })
    }

    const mediaType = isImage ? 'image' : 'video'
    const resourceType = mediaType === 'video' ? 'video' : 'image'

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType,
      folder: 'scoutx/feed',
      use_filename: true,
      unique_filename: true
    })

    deleteFileQuietly(req.file.path)

    return res.json({
      success: true,
      data: {
        media_url: uploadResult.secure_url,
        media_type: mediaType
      },
      message: 'Upload successful'
    })
  } catch (err) {
    console.error('uploadMedia error:', err)
    const filePath = req?.file?.path
    deleteFileQuietly(filePath)
    const details = err?.message || ''
    if (/Unknown API key|Invalid Signature|cloud name/i.test(details)) {
      return res.status(500).json({ success: false, error: 'Upload failed: Cloudinary credentials are invalid or missing.' })
    }
    return res.status(500).json({ success: false, error: 'Upload failed' })
  }
}

module.exports = { uploadMedia }

