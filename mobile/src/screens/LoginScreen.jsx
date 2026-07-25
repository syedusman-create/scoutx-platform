import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import useMobileStore from '../store/index.js'
import { supabase } from '../api/supabase.js'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useMobileStore((state) => state.setAuth)

  const onSubmit = async () => {
    if (!email || !password) {
      return Alert.alert('Validation', 'Email and password are required.')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('role, is_verified')
        .eq('id', data.user.id)
        .single()

      if (dbError) throw dbError

      const fullUser = {
        id: data.user.id,
        email: data.user.email,
        role: dbUser?.role || 'athlete',
        is_verified: dbUser?.is_verified || false
      }

      setAuth(fullUser, data.session.access_token)
    } catch (err) {
      console.error('Login error', err)
      Alert.alert('Login failed', err.message || 'Login error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.form}>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#9ca3af" style={styles.input} secureTextEntry />
      <TouchableOpacity onPress={onSubmit} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { marginTop: 20, padding: 16, backgroundColor: '#0d111a', borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: '#0f172a' },
  button: { backgroundColor: '#c6f135', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: 'bold' }
})
