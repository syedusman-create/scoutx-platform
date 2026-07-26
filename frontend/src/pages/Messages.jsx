import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listConversationsApi,
  getConversationApi,
  sendMessageApi,
  markConversationReadApi,
  searchUsersApi
} from '../api/message.api'
import { useAuth } from '../context/AuthContext.jsx'

// ── Helpers ──────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getInitials(email) {
  if (!email) return '?'
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

function Avatar({ email, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const colors = [
    'bg-lime/20 text-lime', 'bg-ember/20 text-ember',
    'bg-ice/20 text-ice', 'bg-violet-400/20 text-violet-400'
  ]
  const idx = (email?.charCodeAt(0) || 0) % colors.length
  return (
    <div className={`${sizes[size]} ${colors[idx]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {getInitials(email)}
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────
function ConvSkeleton() {
  return (
    <div className="flex gap-3 p-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-edge flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-edge rounded w-3/4" />
        <div className="h-2 bg-edge rounded w-1/2" />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyMessages() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-lift border border-edge flex items-center justify-center text-3xl">
        💬
      </div>
      <div>
        <div className="text-text1 font-semibold text-lg">No messages yet</div>
        <div className="text-text2 text-sm mt-1">
          Click <span className="text-lime font-semibold">+ New</span> above to find and message someone.
        </div>
      </div>
    </div>
  )
}

function EmptyConversation({ name }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <div className="text-3xl">👋</div>
      <div className="text-text1 font-semibold">Say hello to {name}</div>
      <div className="text-text2 text-sm">This is the beginning of your conversation.</div>
    </div>
  )
}

// ── Conversation list item ────────────────────────────────────
function ConvItem({ conv, isActive, onClick }) {
  const displayName = conv.other_user_name || conv.other_user_email?.split('@')[0] || 'User'
  const hasUnread = (conv.unread_count || 0) > 0

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left flex gap-3 items-center px-3 py-3 rounded-lg transition-all duration-150',
        isActive
          ? 'bg-lime/10 border border-lime/20'
          : 'hover:bg-lift border border-transparent'
      ].join(' ')}
    >
      <Avatar email={conv.other_user_email} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${hasUnread ? 'text-text1 font-bold' : 'text-text1 font-semibold'}`}>
            {displayName}
          </span>
          <span className="text-text3 text-xs flex-shrink-0">{formatTime(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-text2 text-xs truncate">
            {conv.last_message_body || `${conv.other_user_role || 'user'}`}
          </span>
          {hasUnread && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-lime text-background text-[10px] font-bold flex items-center justify-center">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── User search result item ────────────────────────────────────
function UserSearchItem({ user, onClick }) {
  const displayName = user.display_name || user.email?.split('@')[0] || 'User'
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex gap-3 items-center px-3 py-2.5 rounded-lg hover:bg-lift transition-all duration-150"
    >
      <Avatar email={user.email} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-text1 text-sm font-semibold truncate">{displayName}</div>
        <div className="text-text3 text-xs">
          {user.email} <span className="capitalize">· {user.role}</span>
        </div>
      </div>
      <span className="text-lime text-xs font-bold flex-shrink-0">Message →</span>
    </button>
  )
}

// ── Message bubble ────────────────────────────────────────────
function MessageBubble({ msg, isMine, showAvatar, senderEmail }) {
  return (
    <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar spacer — only show on received side */}
      {!isMine && (
        <div className="flex-shrink-0 w-7">
          {showAvatar && <Avatar email={senderEmail} size="sm" />}
        </div>
      )}

      <div className={`max-w-[72%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={[
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isMine
              ? 'bg-lime text-[#060810] rounded-br-sm font-medium'
              : 'bg-lift border border-edge text-text1 rounded-bl-sm'
          ].join(' ')}
        >
          {msg.body}
        </div>
        <span className="text-text3 text-[10px] px-1">{formatTime(msg.created_at)}</span>
      </div>
    </div>
  )
}

// ── Chat header ───────────────────────────────────────────────
function ChatHeader({ conv, onBack }) {
  const displayName = conv?.other_user_name || conv?.other_user_email?.split('@')[0] || 'User'
  const role = conv?.other_user_role

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-edge bg-surface flex-shrink-0">
      <button
        onClick={onBack}
        className="lg:hidden text-text2 hover:text-text1 transition-colors p-1 rounded-md hover:bg-lift"
        aria-label="Back"
      >
        ←
      </button>
      {conv && <Avatar email={conv.other_user_email} size="md" />}
      <div className="flex-1 min-w-0">
        <div className="text-text1 font-semibold text-sm">{displayName}</div>
        {role && (
          <div className="text-text2 text-xs capitalize flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
            {role}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSelectedUser = searchParams.get('user') || null
  const [selectedUser, setSelectedUser] = useState(urlSelectedUser)
  const [text, setText] = useState('')
  const [showList, setShowList] = useState(!urlSelectedUser)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const searchInputRef = useRef(null)
  const qc = useQueryClient()

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Conversations list
  const convsQ = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await listConversationsApi()
      return res.data.data || []
    },
    refetchInterval: 10000 // poll every 10s for new convs
  })

  // Active conversation messages
  const convQ = useQuery({
    queryKey: ['conversation', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return { conversation: null, messages: [] }
      const res = await getConversationApi(selectedUser)
      return res.data.data || { conversation: null, messages: [] }
    },
    enabled: !!selectedUser,
    refetchInterval: selectedUser ? 5000 : false // poll every 5s when open
  })

  // User search for "New Message"
  const searchQ = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) return []
      const res = await searchUsersApi(searchQuery.trim())
      const users = res.data?.data || []
      // Filter out self if not already done by backend
      return users.filter(u => u.id !== user?.id)
    },
    enabled: showSearch && searchQuery.trim().length >= 2
  })

  useEffect(() => { scrollToBottom() }, [convQ.data?.messages])

  // Mark read when conversation opens
  const markReadM = useMutation({
    mutationFn: (uid) => markConversationReadApi(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] })
  })

  useEffect(() => {
    setSelectedUser(urlSelectedUser)
    setShowList(!urlSelectedUser)
  }, [urlSelectedUser])

  useEffect(() => {
    if (selectedUser) {
      markReadM.mutate(selectedUser)
    }
  }, [selectedUser])

  const sendM = useMutation({
    mutationFn: () => sendMessageApi(selectedUser, text.trim()),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['conversation', selectedUser] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  const selectConversation = async (uid, conv) => {
    setSelectedUser(uid)
    setShowList(false)
    setSearchParams({ user: uid })
    inputRef.current?.focus()
  }

  const handleSend = (e) => {
    e?.preventDefault()
    if (!text.trim() || !selectedUser || sendM.isPending) return
    sendM.mutate()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const sortedConvs = useMemo(() => {
    const list = convsQ.data || []
    return [...list].sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
  }, [convsQ.data])

  const messages = convQ.data?.messages || []
  const convMeta = convQ.data?.conversation || null
  const activeConv = sortedConvs.find(c => c.other_user_id === selectedUser)

  return (
    <div className="flex h-[calc(100vh-120px)] bg-surface border border-edge rounded-xl overflow-hidden">

      {/* ── Sidebar: Conversation list ── */}
      <div className={[
        'flex flex-col border-r border-edge bg-surface flex-shrink-0',
        'w-full lg:w-80',
        selectedUser && !showList ? 'hidden lg:flex' : 'flex'
      ].join(' ')}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-edge space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-text1 text-lg" style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '1px' }}>
              Messages
            </div>
            <button
              onClick={() => { setShowSearch(v => !v); if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100) }}
              className={[
                'flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border transition-all',
                showSearch
                  ? 'bg-lime/10 border-lime/30 text-lime'
                  : 'text-text3 border-edge hover:text-text1 hover:bg-lift'
              ].join(' ')}
            >
              {showSearch ? '✕ Close' : '+ New'}
            </button>
          </div>
          {showSearch && (
            <div className="relative">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email…"
                className="w-full bg-lift border border-edge rounded-lg px-3 py-2 text-sm text-text1 placeholder:text-text3 outline-none focus:border-lime/50 transition-colors"
              />
              {searchQuery.length >= 2 && searchQ.data && searchQ.data.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {searchQ.data.map(u => (
                    <UserSearchItem
                      key={u.id}
                      user={u}
                      onClick={() => {
                        setShowSearch(false)
                        setSearchQuery('')
                        selectConversation(u.id, null)
                      }}
                    />
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchQ.isFetched && searchQ.data?.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-xl shadow-2xl z-50 p-3 text-center text-text3 text-xs">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {convsQ.isLoading ? (
            <>
              <ConvSkeleton /><ConvSkeleton /><ConvSkeleton />
            </>
          ) : sortedConvs.length === 0 ? (
            <EmptyMessages />
          ) : (
            sortedConvs.map(conv => (
              <ConvItem
                key={conv.other_user_id}
                conv={conv}
                isActive={selectedUser === conv.other_user_id}
                onClick={() => selectConversation(conv.other_user_id, conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main: Chat area ── */}
      <div className={[
        'flex-1 flex flex-col min-w-0',
        selectedUser || !showList ? 'flex' : 'hidden lg:flex'
      ].join(' ')}>

        {!selectedUser ? (
          // No conversation selected
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-lift border border-edge flex items-center justify-center text-4xl">
              💬
            </div>
            <div>
              <div className="text-text1 font-semibold text-xl">Your messages</div>
              <div className="text-text2 text-sm mt-2 max-w-xs">
                Click <span className="text-lime font-semibold">+ New</span> to start a conversation, or use the Message button on any athlete or club profile.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <ChatHeader
              conv={convMeta || activeConv}
              onBack={() => { setShowList(true); setSelectedUser(null) }}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-background">
              {convQ.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-text2 text-sm">Loading messages…</div>
                </div>
              ) : messages.length === 0 ? (
                <EmptyConversation name={
                  convMeta?.other_user_name ||
                  activeConv?.other_user_email?.split('@')[0] ||
                  'this user'
                } />
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === user?.id
                    const prevMsg = messages[i - 1]
                    const showAvatar = !isMine && (
                      !prevMsg || prevMsg.sender_id !== msg.sender_id
                    )
                    return (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        senderEmail={convMeta?.other_user_email}
                      />
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex-shrink-0 flex gap-2 items-end px-4 py-3 border-t border-edge bg-surface"
            >
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message… (Enter to send)"
                rows={1}
                className={[
                  'flex-1 rounded-xl bg-lift border border-edge px-4 py-2.5',
                  'text-text1 text-sm placeholder:text-text3 outline-none resize-none',
                  'focus:border-lime/50 transition-colors duration-150',
                  'max-h-28 overflow-y-auto'
                ].join(' ')}
                style={{ lineHeight: '1.5' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
                }}
              />
              <button
                type="submit"
                disabled={!text.trim() || sendM.isPending}
                className={[
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                  'font-bold text-lg transition-all duration-150',
                  text.trim() && !sendM.isPending
                    ? 'bg-lime text-background hover:brightness-110 active:scale-95'
                    : 'bg-edge text-text3 cursor-not-allowed'
                ].join(' ')}
                aria-label="Send message"
              >
                {sendM.isPending ? (
                  <span className="text-xs animate-spin">↻</span>
                ) : '↑'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
