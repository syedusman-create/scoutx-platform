import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native'
import useMobileStore from '../store/index.js'
import {
  getAdminOverview,
  getAdminUsers,
  getAdminAuditLogs,
  getIntegrations,
  getSocialPosts,
  createSocialPost,
  publishSocialPost
} from '../api/index.js'

export default function AdminHubScreen() {
  const token = useMobileStore((state) => state.token)
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [audits, setAudits] = useState([])
  const [integrations, setIntegrations] = useState([])
  const [posts, setPosts] = useState([])
  const [body, setBody] = useState('')
  const [platforms, setPlatforms] = useState('instagram_business,x')

  const load = async () => {
    setLoading(true)
    try {
      const [ov, us, au, ig, sp] = await Promise.all([
        getAdminOverview(token),
        getAdminUsers(token),
        getAdminAuditLogs(token),
        getIntegrations(token),
        getSocialPosts(token)
      ])
      setOverview(ov.data?.data || {})
      setUsers(us.data?.data || [])
      setAudits(au.data?.data || [])
      setIntegrations(ig.data?.data || [])
      setPosts(sp.data?.data || [])
    } catch (err) {
      Alert.alert('Admin load failed', err?.response?.data?.error || 'Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  const onCreate = async () => {
    try {
      await createSocialPost(token, {
        body,
        platforms: platforms.split(',').map((v) => v.trim()).filter(Boolean)
      })
      setBody('')
      await load()
    } catch (err) {
      Alert.alert('Create failed', err?.response?.data?.error || 'Unable to create social post')
    }
  }

  const onPublish = async (postId) => {
    try {
      await publishSocialPost(token, postId)
      await load()
    } catch (err) {
      Alert.alert('Publish failed', err?.response?.data?.error || 'Unable to publish')
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#c6f135" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Admin ERP</Text>
      <View style={styles.item}>
        <Text style={styles.sub}>Users: {overview?.total_users ?? 0}</Text>
        <Text style={styles.sub}>Athletes: {overview?.total_athletes ?? 0}</Text>
        <Text style={styles.sub}>Clubs: {overview?.total_clubs ?? 0}</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.title}>Social Post</Text>
        <TextInput style={styles.input} value={platforms} onChangeText={setPlatforms} placeholder="instagram_business,x" placeholderTextColor="#9ca3af" />
        <TextInput style={[styles.input, { minHeight: 72 }]} value={body} onChangeText={setBody} multiline placeholder="Write post body..." placeholderTextColor="#9ca3af" />
        <TouchableOpacity style={styles.btn} onPress={onCreate}><Text style={styles.btnText}>Create Draft</Text></TouchableOpacity>
      </View>

      <View style={styles.item}>
        <Text style={styles.title}>Social Drafts</Text>
        {posts.map((p) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.sub}>{p.body}</Text>
            <TouchableOpacity style={styles.btnGhost} onPress={() => onPublish(p.id)}><Text style={styles.btnGhostText}>Publish</Text></TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.item}>
        <Text style={styles.title}>Integrations</Text>
        {integrations.map((i) => <Text key={i.id} style={styles.sub}>{i.provider} - {i.status || 'unknown'}</Text>)}
      </View>

      <View style={styles.item}>
        <Text style={styles.title}>Audit Logs</Text>
        {audits.slice(0, 20).map((a) => <Text key={a.id} style={styles.sub}>{a.action}</Text>)}
      </View>

      <View style={styles.item}>
        <Text style={styles.title}>Recent Users</Text>
        {users.slice(0, 20).map((u) => <Text key={u.id} style={styles.sub}>{u.email} ({u.role})</Text>)}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060810' },
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },
  heading: { color: '#edf2ff', fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  item: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0d111a', marginBottom: 10 },
  title: { color: '#c6f135', fontWeight: '700', marginBottom: 8 },
  sub: { color: '#e2e8f0', fontSize: 13, marginTop: 3 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#f8fafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#0f172a', marginBottom: 8 },
  row: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8, marginTop: 8 },
  btn: { marginTop: 8, backgroundColor: '#c6f135', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  btnText: { color: '#0f172a', fontWeight: '800' },
  btnGhost: { marginTop: 6, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  btnGhostText: { color: '#dbeafe', fontWeight: '700' }
})

