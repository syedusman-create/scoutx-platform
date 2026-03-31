import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import useMobileStore from '../store/index.js'
import { getConversation, markConversationRead, sendMessage } from '../api/index.js'

export default function MessageThreadScreen({ otherUserId, otherUserLabel, onBack }) {
  const token = useMobileStore((state) => state.token)
  const user = useMobileStore((state) => state.user)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')
  const scrollRef = useRef(null)

  const refresh = async () => {
    if (!otherUserId) return
    try {
      const response = await getConversation(token, otherUserId)
      const data = response.data?.data
      setMessages(data?.messages || [])
      await markConversationRead(token, otherUserId)
      setStatus(`Updated ${new Date().toLocaleTimeString()}`)
    } catch {
      setStatus('Failed to refresh')
    }
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [otherUserId])

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages.length])

  const onSend = async () => {
    if (!draft.trim()) return
    await sendMessage(token, otherUserId, draft.trim())
    setDraft('')
    await refresh()
  }

  const rendered = useMemo(
    () =>
      messages.map((m) => {
        const mine = String(m.sender_id) === String(user?.id)
        return (
          <View key={m.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.body, mine ? styles.bodyMine : styles.bodyOther]}>{m.body}</Text>
            <Text style={styles.meta}>
              {new Date(m.created_at).toLocaleTimeString()} {m.read_at ? '• read' : ''}
            </Text>
          </View>
        )
      }),
    [messages, user?.id]
  )

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>Back</Text></TouchableOpacity>
        <View>
          <Text style={styles.title}>{otherUserLabel || otherUserId}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {rendered}
      </ScrollView>

      <View style={styles.compose}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />
        <TouchableOpacity onPress={onSend} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, marginTop: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  back: { color: '#c6f135', fontWeight: '700' },
  title: { color: '#dbeafe', fontWeight: '700' },
  status: { color: '#94a3b8', fontSize: 11 },
  scroll: { maxHeight: 360, borderTopWidth: 1, borderTopColor: '#334155', borderBottomWidth: 1, borderBottomColor: '#334155' },
  scrollContent: { paddingVertical: 8, gap: 6 },
  bubble: { maxWidth: '80%', borderRadius: 10, padding: 10 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#c6f135' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155' },
  body: { fontSize: 14 },
  bodyMine: { color: '#0f172a' },
  bodyOther: { color: '#e2e8f0' },
  meta: { color: '#94a3b8', marginTop: 4, fontSize: 11 },
  compose: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#334155', color: '#f8fafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#0f172a' },
  sendBtn: { backgroundColor: '#c6f135', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  sendText: { color: '#0f172a', fontWeight: '800' }
})

