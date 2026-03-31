import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import useMobileStore from '../store/index.js'
import { searchAthletes } from '../api/index.js'

export default function DiscoverScreen() {
  const token = useMobileStore((state) => state.token)
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await searchAthletes(token)
        setAthletes(response.data?.data || [])
      } catch (err) {
        console.error('Discover fetch error', err)
        setError('Unable to load users')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Discover</Text>
      {loading && <ActivityIndicator color="#c6f135" style={{ marginVertical: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && athletes.length === 0 && <Text style={styles.info}>No athletes found currently.</Text>}
      {athletes.map((athlete) => (
        <View key={athlete.id} style={styles.item}>
          <Text style={styles.name}>{athlete.full_name || athlete.email}</Text>
          <Text style={styles.sub}>{athlete.position || 'N/A'} · Fitness {athlete.fitness_score ?? 0}</Text>
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
  name: { color: '#dbeafe', fontSize: 16, fontWeight: '700' },
  sub: { color: '#94a3b8', fontSize: 13, marginTop: 3 }
})

