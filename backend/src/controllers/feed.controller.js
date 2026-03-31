const PostModel = require('../models/post.model')
const { activityPostSchema, validate } = require('../utils/validators')

const listPosts = async (req, res) => {
  try {
    const posts = await PostModel.listPosts()
    return res.json({ success: true, data: posts })
  } catch (err) {
    console.error('listPosts error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

const createPost = async (req, res) => {
  try {
    const { id: authorId } = req.user
    const { body, media_url, media_type } = req.body

    const { error, value } = validate(activityPostSchema, { body, media_url, media_type })
    if (error) return res.status(400).json({ success: false, error })

    const post = await PostModel.createPost({
      authorId,
      body: value.body,
      mediaUrl: value.media_url,
      mediaType: value.media_type
    })

    return res.json({ success: true, data: post, message: 'Post created' })
  } catch (err) {
    console.error('createPost error:', err)
    return res.status(500).json({ success: false, error: 'Server error' })
  }
}

module.exports = { listPosts, createPost }

