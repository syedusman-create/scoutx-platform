import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import useMobileStore from '../store/index.js'
import { supabase } from '../api/supabase.js'

export default function FeedScreen() {
  const token = useMobileStore((state) => state.token)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          users:user_id (
            email,
            role,
            athlete_profiles (full_name),
            club_profiles (club_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const formatted = (data || []).map(post => {
        const authorUser = post.users
        const athleteProfile = authorUser?.athlete_profiles?.[0]
        const clubProfile = authorUser?.club_profiles?.[0]
        return {
          id: post.id,
          author_name: authorUser?.role === 'athlete' ? athleteProfile?.full_name : clubProfile?.club_name,
          body: post.content,
          created_at: post.created_at
        }
      })
      setPosts(formatted)
    } catch (err) {
      console.error('Feed fetch error', err)
      setError('Unable to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.author}>{item.author_name || 'Anonymous'}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  )

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <Text style={styles.heading}>Feed</Text>
          {loading && <ActivityIndicator color="#c6f135" style={{ marginVertical: 16 }} />}
          {error && <Text style={styles.error}>{error}</Text>}
        </>
      }
      ListEmptyComponent={
        !loading && !error && <Text style={styles.info}>No posts yet. Add your first update from web for quick testing.</Text>
      }
      refreshing={loading}
      onRefresh={load}
    />
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
