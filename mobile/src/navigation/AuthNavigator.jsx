import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import LoginScreen from '../screens/LoginScreen.jsx'
import SignupScreen from '../screens/SignupScreen.jsx'

export default function AuthNavigator() {
  const [mode, setMode] = useState('login')

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <TouchableOpacity onPress={() => setMode('login')} style={[styles.switchButton, mode === 'login' && styles.switchActive]}>
          <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('signup')} style={[styles.switchButton, mode === 'signup' && styles.switchActive]}>
          <Text style={[styles.switchText, mode === 'signup' && styles.switchTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      {mode === 'login' ? <LoginScreen /> : <SignupScreen />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810', padding: 12, justifyContent: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  switchButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginHorizontal: 4 },
  switchActive: { backgroundColor: '#1f2937' },
  switchText: { color: '#94a3b8', fontWeight: '600' },
  switchTextActive: { color: '#c6f135' }
})

