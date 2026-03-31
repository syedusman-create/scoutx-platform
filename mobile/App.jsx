import React from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import AppNavigator from './src/navigation/AppNavigator.jsx'

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <AppNavigator />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060810'
  },
  inner: {
    flex: 1
  }
})

