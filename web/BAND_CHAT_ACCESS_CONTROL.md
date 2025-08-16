# Band Chat Access Control Implementation

## Overview
This document outlines the comprehensive access control system implemented to prevent event organizers from accessing band chats in the Music Connect platform.

## Access Control Layers

### 1. Frontend UI Controls (MessagesPage.tsx)

#### Tab Visibility Control
- **Location**: `web/src/pages/MessagesPage.tsx` (lines ~530-550)
- **Implementation**: Band chats tab is conditionally rendered only for non-organizers
```tsx
{profile?.role !== 'organizer' && (
  <button onClick={() => setActiveTab('band-chats')}>
    <span>Band Chats</span>
  </button>
)}
```

#### URL Parameter Protection
- **Location**: `web/src/pages/MessagesPage.tsx` (lines ~55-65)
- **Implementation**: Forces organizers to stay on conversations tab even if they try to access band-chats via URL
```tsx
useEffect(() => {
  const tabParam = searchParams.get('tab');
  if (tabParam === 'band-chats' && profile?.role !== 'organizer') {
    setActiveTab('band-chats');
  } else if (profile?.role === 'organizer') {
    setActiveTab('conversations');
  }
}, [searchParams, profile?.role]);
```

#### Data Loading Protection
- **Location**: `web/src/pages/MessagesPage.tsx` (lines ~95-105)
- **Implementation**: Prevents loading of band chat data for organizers
```tsx
const loadBandChats = async () => {
  if (!profile) return;
  
  // Event organizers cannot access band chats
  if (profile.role === 'organizer') {
    setBandChats([]);
    return;
  }
  // ... rest of function
};
```

#### Message Display Protection
- **Location**: `web/src/pages/MessagesPage.tsx` (lines ~780-790)
- **Implementation**: Prevents display of band chat messages for organizers
```tsx
) : activeTab === 'band-chats' && selectedBandChat && profile?.role !== 'organizer' ? (
```

#### Message Sending Protection
- **Location**: `web/src/pages/MessagesPage.tsx` (lines ~320-330)
- **Implementation**: Prevents organizers from sending band messages
```tsx
const sendBandMessage = async () => {
  // Additional safety check: prevent organizers from sending band messages
  if (profile.role === 'organizer') {
    alert('Event organizers cannot send messages in band chats.');
    return;
  }
  // ... rest of function
};
```

#### Fallback UI for Organizers
- **Location**: `web/src/pages/MessagesPage.tsx` (lines ~890-900)
- **Implementation**: Shows access denied message if organizers somehow reach band chats
```tsx
) : activeTab === 'band-chats' && profile?.role === 'organizer' ? (
  <div className="flex-1 flex items-center justify-center text-gray-500">
    <div className="text-center">
      <div className="text-6xl mb-4">🚫</div>
      <p className="text-lg font-medium mb-2">Access Denied</p>
      <p className="text-sm text-gray-600">
        Event organizers cannot access band chats. Only musicians can join bands and participate in band conversations.
      </p>
    </div>
  </div>
```

### 2. Database-Level Protection (RLS Policies)

#### Band Chat Messages Table
- **File**: `web/create_band_chat_table_with_rls.sql`
- **Implementation**: Comprehensive RLS policies that prevent organizers from accessing band chat data

##### Read Policy
```sql
CREATE POLICY band_chat_messages_read ON public.band_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_chat_messages.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('leader', 'member')
    )
  );
```

##### Insert Policy
```sql
CREATE POLICY band_chat_messages_insert ON public.band_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_chat_messages.band_id
      AND bm.user_id = auth.uid()
      AND bm.role IN ('leader', 'member')
    )
    AND sender_id = auth.uid()
  );
```

### 3. Related Access Controls

#### Band Creation Prevention
- **File**: `web/src/pages/BandCreatePage.tsx`
- **Implementation**: Prevents organizers from creating bands
```tsx
if (profile?.role === 'organizer') {
  return (
    <div className="text-center">
      <h1>Access Denied</h1>
      <p>Event organizers cannot create bands.</p>
    </div>
  );
}
```

#### Band Management Prevention
- **File**: `web/src/pages/BandsPage.tsx`
- **Implementation**: Organizers can only view bands, not join them
```tsx
{profile?.role === 'organizer' ? (
  // Organizers only see all bands (view-only)
) : (
  // Musicians see different content based on active tab
)}
```

## Security Benefits

### 1. Defense in Depth
- Multiple layers of protection ensure organizers cannot access band chats
- Even if one layer is bypassed, others remain active

### 2. Database-Level Security
- RLS policies provide the strongest protection
- Prevents direct database access even if frontend is compromised

### 3. User Experience
- Clear messaging explains why access is denied
- Graceful fallbacks prevent application errors

### 4. Maintainability
- Centralized role checks make the system easy to modify
- Clear documentation for future developers

## Testing Recommendations

### 1. Frontend Testing
- Test with organizer accounts to ensure band chat tab is hidden
- Test URL manipulation to ensure redirects work
- Test message sending attempts by organizers

### 2. Database Testing
- Test direct database queries with organizer accounts
- Verify RLS policies block unauthorized access
- Test edge cases with different user roles

### 3. Integration Testing
- Test complete user flows for both organizers and musicians
- Verify no data leakage between user types
- Test error handling and user feedback

## Future Considerations

### 1. Audit Logging
- Consider adding audit logs for access attempts
- Monitor for potential security bypass attempts

### 2. Role-Based Permissions
- Consider implementing a more granular permission system
- Allow for future role types with different access levels

### 3. API Security
- Ensure all API endpoints respect role-based access
- Add middleware for consistent role checking

## Conclusion

The implemented access control system provides comprehensive protection against event organizers accessing band chats through multiple layers of security. The combination of frontend UI controls, database-level RLS policies, and clear user feedback ensures a secure and user-friendly experience.
