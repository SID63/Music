import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  sender_profile: {
    display_name: string;
    avatar_url?: string;
  };
  recipient_profile: {
    display_name: string;
    avatar_url?: string;
  };
};

type Conversation = {
  other_profile: {
    id: string;
    display_name: string;
    avatar_url?: string;
    role?: string;
  };
  last_message: {
    id: string;
    content: string;
    created_at: string;
    sender_profile_id: string;
  };
  unread_count: number;
};

export default function MessagesPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'conversations' | 'band-chats'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [bandChats, setBandChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedBandChat, setSelectedBandChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bandMessages, setBandMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'audio' | 'image' | 'video' | null>(null);

  useEffect(() => {
    if (profile) {
      loadConversations();
      loadBandChats();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      setConversations([]);
      setBandChats([]);
      setMessages([]);
      setBandMessages([]);
    };
  }, [profile]);

  // Check URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'band-chats' && profile?.role !== 'organizer') {
      setActiveTab('band-chats');
    } else if (profile?.role === 'organizer') {
      // Force organizers to stay on conversations tab
      setActiveTab('conversations');
    }
  }, [searchParams, profile?.role]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    
    if (conversationParam) {
      // Check if the conversation exists in our loaded conversations
      const conversationExists = conversations.some(c => c.other_profile.id === conversationParam);
      
      if (conversationExists) {
        setSelectedConversation(conversationParam);
      } else if (profile) {
        // If conversation doesn't exist, try to create a new one or load the profile
        const handleNewConversation = async () => {
          try {
            // First, try to get the profile of the user we want to message
            const { data: otherProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, role')
              .eq('id', conversationParam)
              .single();
              
            if (profileError || !otherProfile) {
              console.error('Error loading profile:', profileError);
              return;
            }
            
            // Create a new conversation object
            const newConversation = {
              other_profile: otherProfile,
              last_message: null,
              unread_count: 0
            };
            
            // Add the new conversation to the list
            setConversations(prev => [newConversation, ...prev]);
            
            // Select the conversation
            setSelectedConversation(conversationParam);
            
          } catch (error) {
            console.error('Error creating new conversation:', error);
          }
        };
        
        handleNewConversation();
      }
    }
  }, [searchParams, conversations, profile]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, profile?.id]);

  useEffect(() => {
    if (selectedBandChat) {
      loadBandMessages(selectedBandChat);
    }
  }, [selectedBandChat]);

  const loadBandChats = async () => {
    if (!profile) return;

    // Event organizers cannot access band chats
    if (profile.role === 'organizer') {
      setBandChats([]);
      return;
    }

    try {
      // Get bands where the user is a member
      const { data: bandMemberships, error: membershipError } = await supabase
        .from('band_members')
        .select(`
          band_id,
          bands (
            id,
            name,
            description
          )
        `)
        .eq('user_id', profile.user_id);

      if (membershipError) throw membershipError;

      if (bandMemberships && bandMemberships.length > 0) {
        // Get the last message for each band
        const bandChatsWithMessages = await Promise.all(
          bandMemberships.map(async (membership) => {
            const { data: lastMessage } = await supabase
              .from('band_chat_messages')
              .select('*')
              .eq('band_id', membership.band_id)
              .order('created_at', { ascending: false })
              .limit(1);

            const { data: unreadCount } = await supabase
              .from('band_chat_messages')
              .select('id', { count: 'exact' })
              .eq('band_id', membership.band_id)
              .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

            const band = Array.isArray(membership.bands) ? membership.bands[0] : membership.bands;
            return {
              band,
              lastMessage: lastMessage?.[0] || null,
              unreadCount: unreadCount?.length || 0
            };
          })
        );

        setBandChats(bandChatsWithMessages);
      } else {
        setBandChats([]);
      }
    } catch (error) {
      console.error('Error loading band chats:', error);
      setBandChats([]);
    }
  };

  const loadConversations = async () => {
    if (!profile) return;

    try {
      // Get all unique user IDs that the current user has messaged with
      const { data: conversations, error: conversationsError } = await supabase
        .from('messages')
        .select('sender_profile_id, recipient_profile_id')
        .or(`sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`);

      if (conversationsError) throw conversationsError;

      // Get unique user IDs from conversations
      const userIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.sender_profile_id !== profile?.id) userIds.add(conv.sender_profile_id);
        if (conv.recipient_profile_id !== profile?.id) userIds.add(conv.recipient_profile_id);
      });

      // Get profiles of all users the current user has messaged with
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Get the latest message for each conversation
      const conversationsData = await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${userId}),and(sender_profile_id.eq.${userId},recipient_profile_id.eq.${profile.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const user = profiles.find(p => p.id === userId);
          
          if (!user || !latestMessage) return null;

          return {
            other_profile: {
              id: user.id,
              display_name: user.display_name || '',
              avatar_url: user.avatar_url || '',
              role: user.role || undefined,
            },
            last_message: {
              id: latestMessage.id,
              content: latestMessage.content || '',
              created_at: latestMessage.created_at,
              sender_profile_id: latestMessage.sender_profile_id
            },
            unread_count: 0 // No unread count without read_at column
          };
        })
      );

      // Filter out any null values and sort by latest message time
      const validConversations = conversationsData
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => 
          new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
        );

      setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherProfileId: string) => {
    if (!profile) return;

    try {
      // Fetch the conversation without read_at handling
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_profile_id,
          recipient_profile_id,
          sender_profile:profiles!messages_sender_profile_id_fkey(
            display_name,
            avatar_url
          ),
          recipient_profile:profiles!messages_recipient_profile_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .or(`and(sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${otherProfileId}),and(sender_profile_id.eq.${otherProfileId},recipient_profile_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Ensure we have unique messages and normalize join shapes
      const uniqueMessages = data?.filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      ) || [];

      const normalized = uniqueMessages.map((m: any) => ({
        ...m,
        sender_profile: Array.isArray(m.sender_profile) ? m.sender_profile[0] : m.sender_profile,
        recipient_profile: Array.isArray(m.recipient_profile) ? m.recipient_profile[0] : m.recipient_profile,
      }));
      
      setMessages(normalized as unknown as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadBandMessages = async (bandId: string) => {
    if (!profile) return;

    try {
      // Get messages for this band chat
      const { data, error } = await supabase
        .from('band_chat_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender_name,
          band_id
        `)
        .eq('band_id', bandId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBandMessages(data || []);
    } catch (error) {
      console.error('Error loading band messages:', error);
      alert('Failed to load band messages. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!profile || !selectedConversation || (!newMessage.trim() && !fileUrl)) return;

    setSending(true);
    try {
      let messageContent = newMessage.trim();

      // Add file information to message if present
      if (fileUrl && fileType) {
        const fileInfo = `\n\n--- File Attachment ---\nType: ${fileType}\nURL: ${fileUrl}`;
        messageContent += fileInfo;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_profile_id: profile.id,
          recipient_profile_id: selectedConversation,
          content: messageContent
        });

      if (error) throw error;

      setNewMessage('');
      setFileUrl('');
      setFileType(null);
      await loadMessages(selectedConversation);
      await loadConversations(); // Refresh conversation list
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendBandMessage = async () => {
    if (!profile || !selectedBandChat || (!newMessage.trim() && !fileUrl)) return;

    // Additional safety check: prevent organizers from sending band messages
    if (profile.role === 'organizer') {
      alert('Event organizers cannot send messages in band chats.');
      return;
    }

    setSending(true);
    try {
      let messageContent = newMessage.trim();

      // Add file information to message if present
      if (fileUrl && fileType) {
        const fileInfo = `\n\n--- File Attachment ---\nType: ${fileType}\nURL: ${fileUrl}`;
        messageContent += fileInfo;
      }

      const { error } = await supabase
        .from('band_chat_messages')
        .insert({
          band_id: selectedBandChat,
          sender_id: profile.user_id,
          sender_name: profile.display_name || 'Unknown',
          content: messageContent
        });

      if (error) throw error;

      setNewMessage('');
      setFileUrl('');
      setFileType(null);
      await loadBandMessages(selectedBandChat);
      await loadBandChats(); // Refresh band chat list
    } catch (error) {
      console.error('Error sending band message:', error);
      alert('Failed to send band message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageContent = (content: string) => {
    // Check if content contains file attachment section
    if (content.includes('--- File Attachment ---')) {
      const parts = content.split('--- File Attachment ---');
      const messageContent = parts[0].trim();
      const fileDetails = parts[1]?.trim();
      
      let fileType = '';
      let fileUrl = '';
      
      if (fileDetails) {
        const lines = fileDetails.split('\n');
        lines.forEach(line => {
          if (line.startsWith('Type: ')) {
            fileType = line.replace('Type: ', '').trim();
          } else if (line.startsWith('URL: ')) {
            fileUrl = line.replace('URL: ', '').trim();
          }
        });
      }
      
      return (
        <>
          <div className="mb-3">{formatTextWithMarkdown(messageContent)}</div>
          {fileType && fileUrl && (
            <div className="bg-black/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {fileType === 'audio' ? '🎵' : fileType === 'image' ? '🖼️' : '🎥'}
                </span>
                <span className="text-sm font-medium capitalize">{fileType}</span>
              </div>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-300 hover:text-blue-200 underline break-all"
              >
                {fileUrl}
              </a>
            </div>
          )}
        </>
      );
    }
    
    return formatTextWithMarkdown(content);
  };

  const formatTextWithMarkdown = (text: string) => {
    // Simple markdown formatting
    return text
      .split('\n')
      .map((line, i) => (
        <div key={i} className="mb-2 last:mb-0">
          {line}
        </div>
      ));
  };

  const getAvatarUrl = (profile: any) => {
    if (profile.avatar_url) {
      return profile.avatar_url;
    }
    // Generate a placeholder avatar with initials
    const initials = profile.display_name
      ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      : 'U';
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#6B7280"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${initials}</text>
      </svg>
    `)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Connect with musicians and band members</p>
      </div>

      <Card className="shadow-lg border-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'conversations' | 'band-chats')}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Conversations</span>
              </TabsTrigger>
              {profile?.role !== 'organizer' && (
                <TabsTrigger value="band-chats" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Band Chats</span>
                </TabsTrigger>
              )}
            </TabsList>
          </CardHeader>
          
          <TabsContent value="conversations" className="m-0">
            <CardContent className="p-0">
              {/* Fill viewport minus header (64px). On mobile also minus bottom nav (~64px). */}
              <div className="flex h-[calc(100vh-64px-64px)] md:h-[calc(100vh-64px)] min-h-[500px]">
                {/* Conversations List */}
                <div className={`${selectedConversation ? 'hidden md:flex md:w-1/3' : 'w-full md:w-1/3'} border-r border-gray-200 flex flex-col`}>
                  {/* Search conversations */}
                  <div className="p-3 border-b border-gray-100">
                    <Input
                      value={conversationSearch}
                      onChange={(e) => setConversationSearch(e.target.value)}
                      placeholder="Search conversations"
                      inputMode="search"
                      className="h-10"
                      aria-label="Search conversations"
                    />
                  </div>
                  <ScrollArea className="flex-1">
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p>No conversations yet</p>
                        <p className="text-sm mt-2">Start messaging musicians or event organizers!</p>
                      </div>
                    ) : (
                      conversations
                        .filter((c) =>
                          conversationSearch.trim()
                            ? c.other_profile.display_name?.toLowerCase().includes(conversationSearch.toLowerCase()) ||
                              c.last_message?.content?.toLowerCase().includes(conversationSearch.toLowerCase())
                            : true
                        )
                        .map((conversation) => (
                          <div
                            key={conversation.other_profile.id}
                            onClick={() => setSelectedConversation(conversation.other_profile.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedConversation === conversation.other_profile.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={getAvatarUrl(conversation.other_profile)} />
                                <AvatarFallback>
                                  {conversation.other_profile.display_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <Link 
                                    to={`/musicians/${conversation.other_profile.id}`}
                                    className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {conversation.other_profile.display_name}
                                  </Link>
                                  {conversation.last_message && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      {formatTime(conversation.last_message.created_at)}
                                    </span>
                                  )}
                                </div>
                                {conversation.last_message ? (
                                  <p className="text-xs text-gray-600 truncate mt-1">
                                    {conversation.last_message.sender_profile_id === profile?.id ? 'You: ' : ''}
                                    {conversation.last_message.content}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 italic mt-1">
                                    No messages yet
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {conversation.other_profile.role}
                                  </Badge>
                                  {conversation.unread_count > 0 && (
                                    <Badge className="bg-blue-600 text-white text-xs">
                                      {conversation.unread_count}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </ScrollArea>
                </div>
                
                {/* Messages Area */}
                <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0`}>
                  {selectedConversation ? (
                    <>
                      {/* Individual Conversation Header */}
                      <div className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                        {/* Back button for mobile */}
                        <button
                          type="button"
                          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
                          onClick={() => setSelectedConversation(null)}
                          aria-label="Back to conversations"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const conversation = conversations.find(c => c.other_profile.id === selectedConversation);
                            if (!conversation) return null;
                            
                            return (
                              <>
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={getAvatarUrl(conversation.other_profile)} />
                                  <AvatarFallback>
                                    {conversation.other_profile.display_name?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link 
                                    to={`/musicians/${conversation.other_profile.id}`}
                                    className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors"
                                  >
                                    {conversation.other_profile.display_name}
                                  </Link>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {conversation.other_profile.role}
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4 min-h-0">
                        <div className="space-y-3">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_profile_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] md:max-w-md px-3 py-2 rounded-2xl ${
                                message.sender_profile_id === profile?.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {formatMessageContent(message.content)}
                                </div>
                                <p className={`text-xs mt-2 opacity-75 ${
                                  message.sender_profile_id === profile?.id ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="space-y-3">
                          {/* File URL Input */}
                          <div className="flex items-center space-x-2">
                            <Select value={fileType || 'none'} onValueChange={(value) => setFileType(value === 'none' ? null : value as 'audio' | 'image' | 'video' | null)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="No file" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No file</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                            {fileType && (
                              <Input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder={`Enter ${fileType} URL...`}
                                className="flex-1"
                              />
                            )}
                          </div>
                          
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Type your message..."
                            className="min-h-[64px] resize-none"
                            disabled={sending}
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Press Enter to send, Shift+Enter for new line
                            </span>
                            <Button
                              onClick={sendMessage}
                              disabled={sending || (!newMessage.trim() && (!fileUrl || !fileType))}
                              size="sm"
                            >
                              {sending ? 'Sending...' : 'Send'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-lg font-medium">Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="band-chats" className="m-0">
            <CardContent className="p-0">
              <div className="flex h-[calc(100vh-64px-64px)] md:h-[calc(100vh-64px)] min-h-[500px]">
                {/* Band Chats List */}
                <div className={`${selectedBandChat ? 'hidden md:flex md:w-1/3' : 'w-full md:w-1/3'} border-r border-gray-200 flex flex-col`}>
                  <ScrollArea className="flex-1">
                    {bandChats.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p>No band chats yet</p>
                        <p className="text-sm mt-2">
                          {profile?.role === 'musician' 
                            ? "Join a band to start chatting with your band members!"
                            : "As an event organizer, you can browse bands but cannot join them for chatting."
                          }
                        </p>
                      </div>
                    ) : (
                      bandChats.map((bandChat) => (
                        <div
                          key={bandChat.band.id}
                          onClick={() => setSelectedBandChat(bandChat.band.id)}
                          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedBandChat === bandChat.band.id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">🎸</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {bandChat.band.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {bandChat.lastMessage ? formatTime(bandChat.lastMessage.created_at) : 'No messages'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate mt-1">
                                {bandChat.lastMessage ? (
                                  bandChat.lastMessage.sender_id === profile?.user_id ? 'You: ' : ''
                                ) : ''}
                                {bandChat.lastMessage ? bandChat.lastMessage.content : 'Start the conversation!'}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline" className="text-xs">Band Chat</Badge>
                                {bandChat.unreadCount > 0 && (
                                  <Badge className="bg-purple-600 text-white text-xs">
                                    {bandChat.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
                
                {/* Band Messages Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  {selectedBandChat && profile?.role !== 'organizer' ? (
                    <>
                      {/* Band Chat Header */}
                      <div className="p-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const bandChat = bandChats.find(bc => bc.band.id === selectedBandChat);
                            if (!bandChat) return null;
                            
                            return (
                              <>
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">🎸</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900 text-sm">
                                    {bandChat.band.name}
                                  </span>
                                  <p className="text-xs text-gray-500">Band Chat</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Band Messages */}
                      <ScrollArea className="flex-1 p-4 min-h-0">
                        <div className="space-y-3">
                          {bandMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_id === profile?.user_id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                message.sender_id === profile?.user_id
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {formatMessageContent(message.content)}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`text-xs opacity-75 ${
                                    message.sender_id === profile?.user_id ? 'text-purple-100' : 'text-gray-500'
                                  }`}>
                                    {message.sender_name}
                                  </span>
                                  <p className={`text-xs opacity-75 ${
                                    message.sender_id === profile?.user_id ? 'text-purple-100' : 'text-gray-500'
                                  }`}>
                                    {formatTime(message.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {/* Band Message Input */}
                      <div className="p-4 border-t border-gray-200 flex-shrink-0">
                        <div className="space-y-3">
                          {/* File URL Input */}
                          <div className="flex items-center space-x-2">
                            <Select value={fileType || 'none'} onValueChange={(value) => setFileType(value === 'none' ? null : value as 'audio' | 'image' | 'video' | null)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="No file" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No file</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                            {fileType && (
                              <Input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder={`Enter ${fileType} URL...`}
                                className="flex-1"
                              />
                            )}
                          </div>
                          
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendBandMessage()}
                            placeholder="Type your message..."
                            className="min-h-[80px] resize-none"
                            disabled={sending}
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Press Enter to send, Shift+Enter for new line
                            </span>
                            <Button
                              onClick={sendBandMessage}
                              disabled={sending || (!newMessage.trim() && (!fileUrl || !fileType))}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {sending ? 'Sending...' : 'Send'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : selectedBandChat && profile?.role === 'organizer' ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🚫</div>
                        <p className="text-lg font-medium mb-2">Access Denied</p>
                        <p className="text-sm text-gray-600">
                          Event organizers cannot access band chats. Only musicians can join bands and participate in band conversations.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-lg font-medium">Select a band to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
