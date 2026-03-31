import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import useMobileStore from '../store/index.js'
import { listMessages } from '../api/index.js'
import MessageThreadScreen from './MessageThreadScreen.jsx'

export default function MessagesScreen() {
  const token = useMobileStore((state) => state.token)
  const [conversations, setConversations] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await listMessages(token)
      setConversations(response.data?.data || [])
    } catch (err) {
      console.error('Messages fetch error', err)
      setError('Unable to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadConversations()
  }, [token])

  useEffect(() => {
    if (!token) return
    const t = setInterval(loadConversations, 10000)
    return () => clearInterval(t)
  }, [token])

  const openConversation = (otherUserId, otherUserEmail) => {
    setSelectedUserId(otherUserId)
    setSelectedLabel(otherUserEmail || String(otherUserId))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Messages</Text>
      {loading && <ActivityIndicator color="#c6f135" style={{ marginVertical: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && conversations.length === 0 && <Text style={styles.info}>No conversations yet.</Text>}
      {conversations.map((conv) => (
        <TouchableOpacity key={conv.other_user_id} style={styles.item} onPress={() => openConversation(conv.other_user_id, conv.other_user_email)}>
          <Text style={styles.name}>{conv.other_user_email || conv.other_user_id}</Text>
          <Text style={styles.sub}>{conv.last_message_body || 'No messages yet'}</Text>
          <Text style={styles.meta}>
            {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : ''}
            {conv.unread_count ? ` • ${conv.unread_count} unread` : ''}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedUserId ? (
        <MessageThreadScreen
          otherUserId={selectedUserId}
          otherUserLabel={selectedLabel}
          onBack={() => {
            setSelectedUserId(null)
            setSelectedLabel('')
            loadConversations()
          }}
        />
      ) : null}
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
  name: { color: '#c6f135', fontWeight: '700', marginBottom: 4 },
  sub: { color: '#e2e8f0', fontSize: 14 },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 6 }
})



