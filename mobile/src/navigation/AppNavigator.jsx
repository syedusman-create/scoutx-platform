import React, { useEffect, useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import DiscoverScreen from '../screens/DiscoverScreen.jsx'
import FeedScreen from '../screens/FeedScreen.jsx'
import MessagesScreen from '../screens/MessagesScreen.jsx'
import ProfileScreen from '../screens/ProfileScreen.jsx'
import TrialsScreen from '../screens/TrialsScreen.jsx'
import PipelineScreen from '../screens/PipelineScreen.jsx'
import AdminHubScreen from '../screens/AdminHubScreen.jsx'
import AuthNavigator from './AuthNavigator.jsx'
import useMobileStore from '../store/index.js'

const SCREENS = {
  discover: DiscoverScreen,
  feed: FeedScreen,
  trials: TrialsScreen,
  messages: MessagesScreen,
  profile: ProfileScreen,
  pipeline: PipelineScreen,
  admin: AdminHubScreen
}

export default function AppNavigator() {
  const token = useMobileStore((state) => state.token)
  const user = useMobileStore((state) => state.user)
  const role = user?.role
  const tabs = [
    { key: 'discover', label: 'Discover' },
    { key: 'feed', label: 'Feed' },
    { key: 'trials', label: 'Trials' },
    ...(role === 'club' ? [{ key: 'pipeline', label: 'Pipeline' }] : []),
    { key: 'messages', label: 'Messages' },
    { key: 'profile', label: 'Profile' },
    ...(role === 'admin' ? [{ key: 'admin', label: 'Admin ERP' }] : [])
  ]
  const [activeTab, setActiveTab] = useState('discover')
  const ActiveScreen = SCREENS[activeTab] || DiscoverScreen

  useEffect(() => {
    if (!tabs.some((t) => t.key === activeTab)) {
      setActiveTab('discover')
    }
  }, [activeTab, tabs])

  if (!token) {
    return <AuthNavigator />
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActiveScreen />
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1d2535', backgroundColor: '#0c1018' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#111722' },
  tabLabel: { color: '#8892a4', fontWeight: '600' },
  tabLabelActive: { color: '#c6f135' }
})

