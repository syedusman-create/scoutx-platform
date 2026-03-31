import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native'
import useMobileStore from '../store/index.js'
import { getOpportunities, applyToOpportunity, getMyApplications, createOpportunity } from '../api/index.js'

export default function TrialsScreen() {
  const token = useMobileStore((state) => state.token)
  const user = useMobileStore((state) => state.user)
  const [opportunities, setOpportunities] = useState([])
  const [myApplicationMap, setMyApplicationMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [applyingId, setApplyingId] = useState(null)
  const [clubForm, setClubForm] = useState({ title: '', position: '', venue: '', description: '' })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getOpportunities(token)
        setOpportunities(response.data?.data || [])
        if (user?.role === 'athlete') {
          const appsResp = await getMyApplications(token)
          const apps = appsResp.data?.data || []
          const map = {}
          apps.forEach((a) => {
            map[String(a.opportunity_id)] = a.status
          })
          setMyApplicationMap(map)
        }
      } catch (err) {
        console.error('Opportunities fetch error', err)
        setError('Unable to load trials/opportunities')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token, user?.role])

  const handleApply = async (opportunityId) => {
    try {
      setApplyingId(opportunityId)
      const response = await applyToOpportunity(token, opportunityId)
      if (response.data?.success) {
        Alert.alert('Applied', 'Your application has been submitted.')
        setMyApplicationMap((prev) => ({ ...prev, [String(opportunityId)]: 'applied' }))
      } else {
        Alert.alert('Apply failed', response.data?.error || 'Unable to apply.')
      }
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Unable to apply.'
      Alert.alert('Apply failed', message)
    } finally {
      setApplyingId(null)
    }
  }

  const handleCreateOpportunity = async () => {
    try {
      if (!clubForm.title.trim()) {
        Alert.alert('Validation', 'Title is required')
        return
      }
      const response = await createOpportunity(token, clubForm)
      if (response.data?.success) {
        Alert.alert('Posted', 'Opportunity created successfully.')
        setClubForm({ title: '', position: '', venue: '', description: '' })
        const reload = await getOpportunities(token)
        setOpportunities(reload.data?.data || [])
      } else {
        Alert.alert('Post failed', response.data?.error || 'Unable to create opportunity.')
      }
    } catch (err) {
      Alert.alert('Post failed', err?.response?.data?.error || err?.message || 'Unable to create opportunity.')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Trials</Text>
      {loading && <ActivityIndicator color="#c6f135" style={{ marginVertical: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {user?.role === 'club' ? (
        <View style={styles.item}>
          <Text style={styles.title}>Post trial/opportunity</Text>
          <TextInput style={styles.input} value={clubForm.title} onChangeText={(v) => setClubForm((f) => ({ ...f, title: v }))} placeholder="Title" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} value={clubForm.position} onChangeText={(v) => setClubForm((f) => ({ ...f, position: v }))} placeholder="Position" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} value={clubForm.venue} onChangeText={(v) => setClubForm((f) => ({ ...f, venue: v }))} placeholder="Venue" placeholderTextColor="#9ca3af" />
          <TextInput style={[styles.input, { minHeight: 70 }]} multiline value={clubForm.description} onChangeText={(v) => setClubForm((f) => ({ ...f, description: v }))} placeholder="Description" placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={styles.button} onPress={handleCreateOpportunity}>
            <Text style={styles.buttonText}>Post Opportunity</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {!loading && opportunities.length === 0 && <Text style={styles.info}>No trials/opportunities currently available.</Text>}
      {opportunities.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{item.club_name || 'Unknown club'} · {item.position || 'Any position'}</Text>
          <Text style={styles.text}>{item.venue || 'Location unknown'}</Text>
          <Text style={styles.text}>{item.trial_date ? new Date(item.trial_date).toLocaleDateString() : 'Trial date TBD'}</Text>
          <Text style={styles.status}>
            {item.expires_at && new Date(item.expires_at) < new Date() ? 'Expired' : item.is_active ? 'Active' : 'Inactive'}
            {myApplicationMap[String(item.id)] ? ` • Your status: ${myApplicationMap[String(item.id)]}` : ''}
          </Text>
          {user?.role === 'athlete' ? (
            <TouchableOpacity
              style={[styles.button, (applyingId === item.id || myApplicationMap[String(item.id)]) && styles.buttonDisabled]}
              onPress={() => handleApply(item.id)}
              disabled={applyingId === item.id || Boolean(myApplicationMap[String(item.id)])}
            >
              <Text style={styles.buttonText}>
                {myApplicationMap[String(item.id)] ? 'Applied' : applyingId === item.id ? 'Applying...' : 'Apply'}
              </Text>
            </TouchableOpacity>
          ) : null}
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
  error: { color: '#fca5a5', marginBottom: 8 },
  item: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0d111a', marginBottom: 10 },
  title: { color: '#c6f135', fontSize: 16, fontWeight: '700' },
  sub: { color: '#94a3b8', marginBottom: 6 },
  text: { color: '#e2e8f0', fontSize: 13 },
  status: { color: '#94a3b8', marginTop: 6, fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#f8fafc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#0f172a', marginTop: 8 },
  button: { marginTop: 10, backgroundColor: '#c6f135', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#0f172a', fontWeight: '800' }
})



