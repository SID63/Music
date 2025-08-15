# Band Events Functionality

This document describes the new band events functionality that allows bands to post events and accept events, with band leaders having control over these actions.

## Overview

The band events functionality extends the existing event system to support:
- Bands posting events on behalf of their band
- Bands applying for events on behalf of their band
- Band leaders managing their band's events and applications
- Clear distinction between individual and band actions

## Database Changes

### Events Table
- Added `band_id` column (UUID, references bands.id)
- Added `posted_by_type` column (text, 'individual' or 'band')

### Bookings Table
- Added `band_id` column (UUID, references bands.id)
- Added `applied_by_type` column (text, 'individual' or 'band')

### RLS Policies
Updated Row Level Security policies to allow:
- Band leaders to create/update/delete events for their bands
- Band leaders to create/update/delete bookings for their bands
- Band leaders to view applications for events their bands posted
- Band leaders to view applications made by their bands

## New Components

### BandActionSelector
A reusable component that allows users to choose whether to perform an action as an individual or as a band leader.

**Features:**
- Shows user's bands where they are a leader
- Radio button selection between individual and band actions
- Dropdown to select specific band when applying as band leader
- Handles cases where user has no bands

**Usage:**
```tsx
<BandActionSelector
  onSelect={(actionType, bandId) => {
    // Handle selection
  }}
  title="Choose Action Type"
  description="Select whether to perform this action as an individual or as a band leader"
/>
```

### EventApplicationForm
A form component for applying to events that supports both individual and band applications.

**Features:**
- Integrates with BandActionSelector
- Handles quotation and additional requirements
- Shows event details
- Supports both individual and band applications

**Usage:**
```tsx
<EventApplicationForm
  event={event}
  onSuccess={() => {
    // Handle successful application
  }}
  onCancel={() => {
    // Handle cancellation
  }}
/>
```

## Updated Components

### EventPostForm
Enhanced to support posting events as a band:
- Shows BandActionSelector when user submits form
- Includes band information in event data
- Displays band context when posting as band

### EventApplicationsManager
Enhanced to show band information:
- Displays band name for band applications
- Shows "Applied by [musician]" for band applications
- Includes "Band Application" badge
- Loads and displays band data

### EventsBoard
Enhanced to show band information:
- Displays "Posted by [Band Name]" badge for events posted by bands
- Loads and displays band data for events

## New Services

### eventService
A comprehensive service for event-related operations:

**Functions:**
- `getEvents()` - Get all events with organizer and band information
- `getUserEvents(userId)` - Get events for a specific user (as organizer or band leader)
- `getEventApplications(events)` - Get applications for events
- `createEvent(eventData)` - Create a new event
- `updateEvent(eventId, eventData)` - Update an event
- `deleteEvent(eventId)` - Delete an event
- `applyForEvent(applicationData)` - Apply for an event
- `updateApplicationStatus(applicationId, status)` - Update application status

## User Experience Flow

### Posting Events as Band Leader
1. User navigates to "Post Event" page
2. Fills out event form
3. Submits form
4. BandActionSelector appears
5. User selects "As Band Leader" and chooses band
6. Event is posted with band information

### Applying for Events as Band Leader
1. User clicks "Apply for Event" on an event
2. EventApplicationForm appears
3. BandActionSelector appears
4. User selects "As Band Leader" and chooses band
5. User fills out quotation and requirements
6. Application is submitted with band information

### Managing Band Events
1. Band leaders can see their band's events in "My Events"
2. Band leaders can edit/delete their band's events
3. Band leaders can view applications for their band's events
4. Band leaders can accept/decline applications for their band's events

### Viewing Band Applications
1. Event organizers see band applications with band name prominently displayed
2. Shows "Applied by [musician]" to indicate who submitted the application
3. "Band Application" badge clearly identifies band applications
4. Band information is loaded and displayed

## Security Considerations

### RLS Policies
- Band leaders can only manage events for bands they lead
- Band leaders can only manage applications for their bands
- Users cannot access other users' band data
- Proper validation ensures data integrity

### Data Validation
- Band ID must reference a valid band
- Posted/applied by type must be 'individual' or 'band'
- Band leaders must be validated before allowing band actions

## Migration

To apply the database changes, run the SQL migration:
```sql
-- Run the migration file: add_band_support_to_events_and_bookings.sql
```

This will:
1. Add new columns to events and bookings tables
2. Create necessary indexes
3. Update RLS policies
4. Add documentation comments

## Future Enhancements

Potential future improvements:
- Band member notifications when band applies for events
- Band collaboration features
- Band performance history
- Band-specific ratings and reviews
- Band scheduling and availability management
