# Troubleshooting Guide

## Authentication Issues

### Common Error: "Invalid login credentials" (400 error)
- **Cause**: User is trying to sign in with incorrect email/password
- **Solution**: Verify the email and password are correct
- **Prevention**: Better error messages now guide users to check their credentials

### Common Error: Profile creation conflict (409 error)
- **Cause**: System tries to create a profile that already exists due to unique constraint on `user_id`
- **Solution**: Fixed in AuthContext.tsx - now checks for existing profile before creating new one
- **Prevention**: Added proper error handling and profile existence checks

## Profile Creation Issues

### Issue: Profile not created after email verification
- **Cause**: Pending profile data in localStorage may be stale or corrupted
- **Solution**: 
  1. Clear browser localStorage: `localStorage.clear()`
  2. Sign out and sign in again
  3. If issue persists, manually create profile through the app

### Issue: Multiple profile creation attempts
- **Cause**: Race conditions or stale pending data
- **Solution**: Added timestamp validation and automatic cleanup of stale data

### Issue: React Object Rendering Error
- **Error**: "Objects are not valid as a React child (found: object with keys {count})"
- **Cause**: Supabase count queries return objects with a `count` property instead of simple numbers
- **Solution**: Fixed in bandService.ts - count objects are now properly extracted to numbers
- **Prevention**: Added type checking in components to handle both object and number types

### Issue: AuthProvider Context Error
- **Error**: "useAuth must be used within an AuthProvider" or "useAuth is not defined"
- **Cause**: Component trying to use useAuth hook outside of AuthProvider scope, or missing import
- **Solution**: Moved AuthNav component to separate file and ensured proper import, restored useAuth import in App.tsx
- **Prevention**: Always ensure components using auth hooks are wrapped in AuthProvider and properly imported

### Issue: Foreign Key Relationship Error
- **Error**: "Could not find a relationship between 'band_members' and 'profiles' in the schema cache"
- **Cause**: Nested queries trying to join tables without proper foreign key relationships or RLS policies
- **Solution**: Separated nested queries into individual queries and combined data in JavaScript
- **Prevention**: Avoid complex nested queries when RLS policies might block them

### Issue: Band Creator Not Added as Leader
- **Error**: Band creator cannot see join requests because they're not a band member/leader
- **Cause**: The `createBand` function failed to add the creator as a leader due to unhandled errors
- **Solution**: Fixed `createBand` function to properly handle errors and added `fixBandCreator` utility function
- **Prevention**: Always handle errors in band creation and ensure creator is added as leader

### Issue: RLS Policy Blocks Band Creation
- **Error**: "new row violates row-level security policy for table 'band_members'" (403 Forbidden)
- **Cause**: RLS policy requires user to be a leader before adding members, but band creation needs to add the creator as leader first
- **Solution**: Update RLS policy to allow users to add themselves as band members
- **Prevention**: Ensure RLS policies don't create circular dependencies

### Issue: Profile Data Not Loading (406 Not Acceptable)
- **Error**: "406 Not Acceptable" when fetching profile data for band members
- **Cause**: Using wrong field (`id` instead of `user_id`) to query profiles table
- **Solution**: Fixed profile queries to use `user_id` field instead of `id`
- **Prevention**: Always verify foreign key relationships and field mappings

## Debug Utilities

### Using Debug Functions
```javascript
// In browser console, you can use these functions:
import { debugAuthState, clearAllAuthData } from './src/utils/debugUtils';

// Check current auth state
debugAuthState();

// Clear all auth data (use with caution)
clearAllAuthData();
```

### Manual Profile Check
```sql
-- Check if profile exists for a user
SELECT * FROM profiles WHERE user_id = 'your-user-id';

-- Check all profiles
SELECT * FROM profiles ORDER BY created_at DESC;
```

## Recent Fixes Applied

1. **Fixed 409 Conflict Error**: Added proper profile existence check before creation
2. **Improved Error Handling**: Better error messages for common authentication issues
3. **Added Timestamp Validation**: Pending profile data now expires after 24 hours
4. **Enhanced Debug Logging**: Added utilities to help troubleshoot issues
5. **Graceful Fallback**: If profile creation fails, system tries to fetch existing profile
6. **Fixed React Object Rendering Error**: Fixed Supabase count queries returning objects instead of numbers
7. **Fixed AuthProvider Context Error**: Moved AuthNav component to separate file to fix context scope issues
8. **Fixed Band Detail Query Error**: Separated band and member queries to avoid RLS policy conflicts
9. **Enhanced Count Extraction**: Improved member count processing with better type checking and debug logging
10. **Fixed Foreign Key Relationship Error**: Separated nested queries to avoid RLS policy conflicts
11. **Added Band Request Management**: Created UI for band leaders to view and manage join requests
12. **Fixed Band Creator Issue**: Improved `createBand` function to properly handle errors and ensure creator is added as leader
13. **Added Band Management Features**: Disband band functionality, My Bands section, My Events section
14. **Added Event Editing**: Event organizers can now edit their events
15. **Fixed RLS Policy Issue**: Updated band_members RLS policy to allow band creation
16. **Fixed Profile Data Loading**: Corrected profile queries to use `user_id` instead of `id`
17. **Added Profile View Buttons**: Added "View Profile" buttons to band members and requests

## Prevention Measures

1. **Automatic Cleanup**: Stale pending data is automatically cleared on app initialization
2. **Duplicate Prevention**: System checks for existing profiles before creating new ones
3. **Better Error Messages**: Users get more helpful feedback when things go wrong
4. **Debug Logging**: Profile creation attempts are logged for troubleshooting
5. **Type Safety**: Added checks to prevent objects from being rendered as React children
6. **Data Processing**: Supabase count queries are properly processed to extract numeric values
7. **Component Organization**: Auth-related components are properly organized to avoid context scope issues
8. **Query Optimization**: Complex nested queries are separated to avoid RLS policy conflicts
9. **Data Fetching Strategy**: Related data is fetched separately and combined in JavaScript to avoid foreign key relationship issues
10. **Role-Based Navigation**: Navigation links are conditionally shown based on user roles and permissions
11. **Error Handling**: Band creation now properly handles errors and ensures creator is added as leader
12. **Self-Interaction Prevention**: Users cannot message or review themselves
13. **RLS Policy Design**: Policies are designed to avoid circular dependencies
14. **Database Field Mapping**: Always verify correct field relationships between tables

## If Issues Persist

1. Clear browser data (localStorage, sessionStorage)
2. Check browser console for detailed error messages
3. Verify Supabase connection and RLS policies
4. Check if user exists in auth.users table
5. Verify profile table structure and constraints
