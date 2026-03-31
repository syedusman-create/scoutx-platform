import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import useMobileStore from '../store/index.js'
import { register } from '../api/index.js'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('athlete')
  const [loading, setLoading] = useState(false)
  const setAuth = useMobileStore((state) => state.setAuth)

  const onSubmit = async () => {
    if (!email || !password) {
      return Alert.alert('Validation', 'Email and password are required.')
    }

    setLoading(true)
    try {
      const response = await register({ email, password, role })
      if (response.data?.success) {
        const data = response.data.data
        if (!data?.id) {
          Alert.alert('Signed up', 'Registration successful. Please log in.')
        } else {
          setAuth({ id: data.id, email: data.email, role: data.role }, null)
        }
      } else {
        Alert.alert('Signup failed', response.data?.error || 'Could not sign up.')
      }
    } catch (err) {
      console.error('Signup error', err)
      const message = err?.response?.data?.error || err?.message || 'Signup error'
      Alert.alert('Signup failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#9ca3af" style={styles.input} secureTextEntry />
      <Text style={styles.roleLabel}>Role (athlete / club / scout):</Text>
      <TextInput value={role} onChangeText={setRole} placeholder="athlete" placeholderTextColor="#9ca3af" style={styles.input} autoCapitalize="none" />
      <TouchableOpacity onPress={onSubmit} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { marginTop: 20, padding: 16, backgroundColor: '#0d111a', borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: '#0f172a' },
  roleLabel: { color: '#94a3b8', marginBottom: 6, fontSize: 13 },
  button: { backgroundColor: '#c6f135', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: 'bold' }
})
