import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import useMobileStore from '../store/index.js'
import { listPosts } from '../api/index.js'

export default function FeedScreen() {
  const token = useMobileStore((state) => state.token)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await listPosts(token)
        setPosts(response.data?.data || [])
      } catch (err) {
        console.error('Feed fetch error', err)
        setError('Unable to load feed')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Feed</Text>
      {loading && <ActivityIndicator color="#c6f135" style={{ marginVertical: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && posts.length === 0 && <Text style={styles.info}>No posts yet. Add your first update from web for quick testing.</Text>}
      {posts.map((post) => (
        <View key={post.id} style={styles.item}>
          <Text style={styles.author}>{post.author_name || post.authorId || post.author?.email}</Text>
          <Text style={styles.body}>{post.body}</Text>
          <Text style={styles.meta}>{new Date(post.created_at).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },
  heading: { color: '#edf2ff', fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  info: { color: '#8892a4', fontSize: 14 },
  error: { color: '#fca5a5', fontSize: 14, marginBottom: 8 },
  item: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0d111a', marginBottom: 10 },
  author: { color: '#c6f135', fontWeight: '700', marginBottom: 4 },
  body: { color: '#e2e8f0', fontSize: 14 },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 8 }
})



