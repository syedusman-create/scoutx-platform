const dotenv = require('dotenv')
dotenv.config()

const cloudinary = require('cloudinary').v2

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // Cloudinary uploads are implemented in Phase 6.
  // TODO: add strict validation once uploads are enabled.
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
})

module.exports = { cloudinary }

