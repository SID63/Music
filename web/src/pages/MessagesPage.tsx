import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';

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
    role: string;
  };
  last_message: {
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
  }, [profile]);

  // Check URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'band-chats') {
      setActiveTab('band-chats');
    }
  }, [searchParams]);



  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    
    if (conversationParam && conversations.length > 0) {
      // Check if the conversation exists in our loaded conversations
      const conversationExists = conversations.some(c => c.other_profile.id === conversationParam);
      if (conversationParam) {
        setSelectedConversation(conversationParam);
      }
    }
  }, [searchParams, conversations, profile]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedBandChat) {
      loadBandMessages(selectedBandChat);
    }
  }, [selectedBandChat]);

  const loadBandChats = async () => {
    if (!profile) return;

    try {
      // Get bands where user is a member
      const { data: bandMemberships, error: membershipsError } = await supabase
        .from('band_members')
        .select(`
          band_id,
          band:bands(
            id,
            name,
            description
          )
        `)
        .eq('user_id', profile.user_id);

      if (membershipsError) {
        console.error('Error loading band memberships:', membershipsError);
        return;
      }

      // Get the latest message from each band chat
      const bandChatsWithMessages = await Promise.all(
        (bandMemberships || []).map(async (membership) => {
          if (!membership.band) return null;

          const { data: lastMessage, error: messageError } = await supabase
            .from('band_chat_messages')
            .select('*')
            .eq('band_id', membership.band.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            band: membership.band,
            lastMessage: lastMessage || null,
            unreadCount: 0 // TODO: Implement unread count
          };
        })
      );

      const validBandChats = bandChatsWithMessages.filter(Boolean);
      setBandChats(validBandChats);
    } catch (error) {
      console.error('Error loading band chats:', error);
    }
  };

  const loadConversations = async () => {
    if (!profile) return;

    try {
      // Get all conversations where the current user is involved
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_profile_id,
          recipient_profile_id,
          sender_profile:profiles!messages_sender_profile_id_fkey(
            id,
            display_name,
            avatar_url,
            role
          ),
          recipient_profile:profiles!messages_recipient_profile_id_fkey(
            id,
            display_name,
            avatar_url,
            role
          )
        `)
        .or(`sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      
      data?.forEach((message) => {
        const otherProfileId = message.sender_profile_id === profile.id 
          ? message.recipient_profile_id 
          : message.sender_profile_id;
        
        const otherProfile = message.sender_profile_id === profile.id 
          ? message.recipient_profile 
          : message.sender_profile;

        if (!conversationMap.has(otherProfileId)) {
          conversationMap.set(otherProfileId, {
            other_profile: otherProfile,
            last_message: {
              content: message.content,
              created_at: message.created_at,
              sender_profile_id: message.sender_profile_id
            },
            unread_count: 0
          });
        } else {
          const existing = conversationMap.get(otherProfileId)!;
          if (new Date(message.created_at) > new Date(existing.last_message.created_at)) {
            existing.last_message = {
              content: message.content,
              created_at: message.created_at,
              sender_profile_id: message.sender_profile_id
            };
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherProfileId: string) => {
    if (!profile) return;

    try {
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
      setMessages(data || []);
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
          {fileUrl && fileType && (
            <div className="border-t border-current border-opacity-20 pt-2 text-xs opacity-90">
              <div className="font-medium mb-1">File Attachment:</div>
              {fileType === 'image' && (
                <div className="mb-2">
                  <img src={fileUrl} alt="Shared image" className="max-w-full h-auto rounded-lg" />
                </div>
              )}
              {fileType === 'video' && (
                <div className="mb-2">
                  <video controls className="max-w-full h-auto rounded-lg">
                    <source src={fileUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {fileType === 'audio' && (
                <div className="mb-2">
                  <audio controls className="w-full">
                    <source src={fileUrl} type="audio/mpeg" />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline break-all"
              >
                {fileType.charAt(0).toUpperCase() + fileType.slice(1)} File
              </a>
            </div>
          )}
        </>
      );
    }
    
    // Check if content contains event details section
    if (content.includes('--- Event Details ---')) {
      const parts = content.split('--- Event Details ---');
      const messageContent = parts[0].trim();
      const eventDetails = parts[1]?.trim();
      
      return (
        <>
          <div className="mb-3">{formatTextWithMarkdown(messageContent)}</div>
          {eventDetails && (
            <div className="border-t border-current border-opacity-20 pt-2 text-xs opacity-90">
              <div className="font-medium mb-1">Event Details:</div>
              {eventDetails.split('\n').map((line, index) => {
                if (line.trim() && !line.includes('---')) {
                  return <div key={index} className="opacity-80">{formatTextWithMarkdown(line)}</div>;
                }
                return null;
              })}
            </div>
          )}
        </>
      );
    }
    
    // Regular message without special sections
    return formatTextWithMarkdown(content);
  };

  const formatTextWithMarkdown = (text: string) => {
    // Handle **bold** text
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    
    if (parts.length === 1) {
      // No bold markdown found, check for other formatting
      return formatOtherMarkdown(text);
    }
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is the bold text (odd indices)
        return <strong key={index} className="font-semibold">{formatOtherMarkdown(part)}</strong>;
      }
      return formatOtherMarkdown(part);
    });
  };

  const formatOtherMarkdown = (text: string) => {
    // Handle emojis and bullet points
    let formattedText = text;
    
    // Convert bullet points to proper formatting
    formattedText = formattedText.replace(/^•\s*/gm, '• ');
    
    // Handle line breaks for better readability
    if (formattedText.includes('\n')) {
      const lines = formattedText.split('\n');
      return lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ));
    }
    
    return formattedText;
  };

  const getAvatarUrl = (profile: any) => {
    if (profile.avatar_url) {
      return profile.avatar_url;
    }
    // Return a placeholder SVG for users without avatars
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="20" fill="#6B7280"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${profile.display_name?.charAt(0)?.toUpperCase() || 'U'}</text>
      </svg>
    `)}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'conversations'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Individual Chats</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('band-chats')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'band-chats'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Band Chats</span>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'conversations' ? 'Messages' : 'Band Chats'}
              </h2>
            </div>
            
            <div className="overflow-y-auto h-full">
              {activeTab === 'conversations' ? (
                // Individual Conversations
                conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start by browsing musicians or events to connect with people!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.other_profile.id}
                      onClick={() => setSelectedConversation(conversation.other_profile.id)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.other_profile.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={getAvatarUrl(conversation.other_profile)}
                          alt={conversation.other_profile.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Link 
                              to={`/musicians/${conversation.other_profile.id}`}
                              className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {conversation.other_profile.display_name}
                            </Link>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatTime(conversation.last_message.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {conversation.last_message.sender_profile_id === profile?.id ? 'You: ' : ''}
                            {conversation.last_message.content}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-400 capitalize">
                              {conversation.other_profile.role}
                            </span>
                            {conversation.unread_count > 0 && (
                              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                // Band Chats
                bandChats.length === 0 ? (
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
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedBandChat === bandChat.band.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
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
                            <span className="text-xs text-gray-400">Band Chat</span>
                            {bandChat.unreadCount > 0 && (
                              <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                                {bandChat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'conversations' && selectedConversation ? (
              <>
                {/* Individual Conversation Header */}
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const conversation = conversations.find(c => c.other_profile.id === selectedConversation);
                      if (!conversation) return null;
                      
                      return (
                        <>
                          <img
                            src={getAvatarUrl(conversation.other_profile)}
                            alt={conversation.other_profile.display_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
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
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_profile_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
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

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    {/* File URL Input */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={fileType || ''}
                        onChange={(e) => setFileType(e.target.value as 'audio' | 'image' | 'video' | null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">No file</option>
                        <option value="audio">Audio</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      {fileType && (
                        <input
                          type="url"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder={`Enter ${fileType} URL...`}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                    
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      disabled={sending}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                      </span>
                      <button
                        onClick={sendMessage}
                        disabled={sending || (!newMessage.trim() && !fileUrl)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'band-chats' && selectedBandChat ? (
              <>
                {/* Band Chat Header */}
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🎸</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 text-sm">
                        {bandChats.find(bc => bc.band.id === selectedBandChat)?.band.name}
                      </span>
                      <p className="text-xs text-gray-500">Band Chat</p>
                    </div>
                  </div>
                </div>

                {/* Band Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                          <p className={`text-xs opacity-75 ${
                            message.sender_id === profile?.user_id ? 'text-purple-100' : 'text-gray-500'
                          }`}>
                            {message.sender_name}
                          </p>
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

                {/* Band Message Input */}
                <div className="p-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    {/* File URL Input */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={fileType || ''}
                        onChange={(e) => setFileType(e.target.value as 'audio' | 'image' | 'video' | null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">No file</option>
                        <option value="audio">Audio</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      {fileType && (
                        <input
                          type="url"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder={`Enter ${fileType} URL...`}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                    
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendBandMessage()}
                      placeholder="Type your band message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={2}
                      disabled={sending}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                      </span>
                      <button
                        onClick={sendBandMessage}
                        disabled={sending || (!newMessage.trim() && !fileUrl)}
                        className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-medium">
                    {activeTab === 'conversations' ? 'Select a conversation to start messaging' : 'Select a band to start chatting'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
