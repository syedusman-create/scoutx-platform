import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import useMobileStore from '../store/index.js'
import { listClubShortlists, upsertClubShortlist } from '../api/index.js'

const STAGES = ['applied', 'shortlisted', 'trial', 'offer', 'signed', 'rejected']

export default function PipelineScreen() {
  const token = useMobileStore((state) => state.token)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const response = await listClubShortlists(token)
      setRows(response.data?.data || [])
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  const updateStage = async (athleteId, currentStage) => {
    const idx = STAGES.indexOf(currentStage)
    const nextStage = STAGES[Math.min(STAGES.length - 1, idx + 1)]
    try {
      await upsertClubShortlist(token, athleteId, { stage: nextStage, notes: null })
      Alert.alert('Updated', `Stage moved to ${nextStage}`)
      await load()
    } catch (err) {
      Alert.alert('Update failed', err?.response?.data?.error || 'Unable to update stage')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Pipeline</Text>
      {loading && <ActivityIndicator color="#c6f135" style={{ marginVertical: 16 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {rows.map((r) => (
        <View key={r.id} style={styles.item}>
          <Text style={styles.name}>{r.athlete_name || r.athlete_id}</Text>
          <Text style={styles.sub}>Stage: {r.stage}</Text>
          <TouchableOpacity onPress={() => updateStage(r.athlete_id, r.stage)} style={styles.btn}>
            <Text style={styles.btnText}>Move to next stage</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },
  heading: { color: '#edf2ff', fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  item: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0d111a', marginBottom: 10 },
  name: { color: '#dbeafe', fontWeight: '700' },
  sub: { color: '#94a3b8', marginTop: 4 },
  error: { color: '#fca5a5', marginBottom: 10 },
  btn: { marginTop: 8, backgroundColor: '#c6f135', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  btnText: { color: '#0f172a', fontWeight: '800' }
})

