import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native'
import useMobileStore from '../store/index.js'
import {
  getMyAthleteProfile,
  getAthleteAnalytics,
  updateMyAthleteProfile,
  getMyClubProfile,
  updateMyClubProfile
} from '../api/index.js'

export default function ProfileScreen() {
  const token = useMobileStore((state) => state.token)
  const user = useMobileStore((state) => state.user)
  const logout = useMobileStore((state) => state.logout)

  const [profile, setProfile] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      if (user?.role === 'athlete') {
        const resp = await getMyAthleteProfile(token)
        const nextProfile = resp.data?.data
        setProfile(nextProfile)
        setFormData(nextProfile || {})

        const analyticsResp = await getAthleteAnalytics(resp.data.data.id, token)
        setAnalytics(analyticsResp.data?.data)
      } else if (user?.role === 'club') {
        const resp = await getMyClubProfile(token)
        const nextProfile = resp.data?.data
        setProfile(nextProfile)
        setFormData(nextProfile || {})
      } else {
        setProfile(null)
        setFormData({})
      }
    } catch (err) {
      console.error('Profile fetch error', err)
      setError('Could not fetch profile data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadProfile()
    }
  }, [token, user])

  const onSave = async () => {
    const submit = user?.role === 'athlete' ? updateMyAthleteProfile : updateMyClubProfile
    if (!submit) return

    try {
      setLoading(true)
      const resp = await submit(token, formData)
      if (resp.data?.success) {
        setProfile(resp.data.data)
        setEditing(false)
        Alert.alert('Success', 'Profile updated')
      } else {
        Alert.alert('Error', resp.data?.error || 'Update failed')
      }
    } catch (err) {
      console.error('Profile save error', err)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#c6f135" />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>No profile loaded.</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const setValue = (key, value) => setFormData({ ...formData, [key]: value })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {editing ? (
        <>
          <TextInput
            placeholder="Name / Club"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={formData.full_name || formData.club_name || ''}
            onChangeText={(text) => {
              if (user.role === 'athlete') setValue('full_name', text)
              else setValue('club_name', text)
            }}
          />

          <TextInput
            placeholder="City"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={formData.city || ''}
            onChangeText={(text) => setValue('city', text)}
          />

          <TextInput
            placeholder="State"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={formData.state || ''}
            onChangeText={(text) => setValue('state', text)}
          />

          <TextInput
            placeholder="Bio"
            placeholderTextColor="#9ca3af"
            style={[styles.input, { height: 100 }]}
            value={formData.bio || ''}
            onChangeText={(text) => setValue('bio', text)}
            multiline
          />

          <TouchableOpacity onPress={onSave} style={styles.button}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>{user.role === 'athlete' ? profile.full_name || user.email : profile.club_name || user.email}</Text>
            <Text style={styles.sub}>{user.role === 'athlete' ? profile.position || 'Player' : profile.league || 'Club'}</Text>
            <Text style={styles.text}>City: {profile.city || 'N/A'}</Text>
            <Text style={styles.text}>State: {profile.state || 'N/A'}</Text>
            <Text style={styles.text}>Bio: {profile.bio || 'N/A'}</Text>
          </View>

          {user.role === 'athlete' && analytics && (
            <View style={styles.card}>
              <Text style={styles.title}>Analytics</Text>
              <Text style={styles.text}>Profile views: {analytics.profile_views || 0}</Text>
              <Text style={styles.text}>Applications: {analytics.applications || 0}</Text>
              <Text style={styles.text}>Shortlists: {analytics.shortlists || 0}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#060810' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heading: { color: '#edf2ff', fontSize: 28, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  toggleBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  toggleText: { color: '#c6f135', fontWeight: '700' },
  logoutBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  logoutText: { color: '#c6f135', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#334155', color: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: '#0f172a' },
  button: { backgroundColor: '#c6f135', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: 'bold' },
  card: { backgroundColor: '#0d111a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 12 },
  title: { color: '#c6f135', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  sub: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  text: { color: '#e2e8f0', fontSize: 13, marginBottom: 4 },
  info: { color: '#8892a4', fontSize: 14 },
  error: { color: '#fca5a5', marginBottom: 10 }
})



