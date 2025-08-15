# Testing Band Events Functionality

This guide provides step-by-step instructions to test the new band events functionality.

## Prerequisites

1. Run the database migration:
   ```sql
   -- Execute the SQL in: add_band_support_to_events_and_bookings.sql
   ```

2. Ensure you have at least one band where you are a leader
3. Ensure you have a musician or organizer profile

## Test Scenarios

### 1. Posting Events as Band Leader

**Steps:**
1. Log in as a user who is a leader of at least one band
2. Navigate to "Post Event" page
3. Fill out the event form with all required fields
4. Click "Post Event"
5. Verify that the BandActionSelector appears
6. Select "As Band Leader" and choose your band
7. Click "Continue"
8. Verify the event is posted successfully
9. Navigate to Events Board and verify the event shows "Posted by [Band Name]"

**Expected Results:**
- BandActionSelector should appear after form submission
- Event should be posted with band information
- Event should display band name in the events list
- Event should appear in "My Events" section

### 2. Applying for Events as Band Leader

**Steps:**
1. Log in as a user who is a leader of at least one band
2. Navigate to Events Board
3. Find an event you want to apply for (not your own)
4. Click "Apply for Event" or similar button
5. Verify that the BandActionSelector appears
6. Select "As Band Leader" and choose your band
7. Fill out quotation and additional requirements
8. Submit the application
9. Verify the application is submitted successfully

**Expected Results:**
- BandActionSelector should appear when applying
- Application should be submitted with band information
- Event organizer should see band application with band name

### 3. Managing Band Events

**Steps:**
1. Log in as a band leader
2. Navigate to "My Events" section
3. Verify that events posted by your band are listed
4. Try to edit a band event
5. Try to delete a band event
6. View applications for your band's events

**Expected Results:**
- Band events should appear in "My Events"
- You should be able to edit/delete your band's events
- You should be able to view applications for your band's events

### 4. Viewing Band Applications (Event Organizer)

**Steps:**
1. Log in as an event organizer
2. Navigate to "Event Applications" or similar section
3. Look for applications from bands
4. Verify band information is displayed correctly

**Expected Results:**
- Band applications should show band name prominently
- Should show "Applied by [musician]" for band applications
- Should display "Band Application" badge
- Band information should be loaded and displayed

### 5. Individual vs Band Actions

**Steps:**
1. Test posting events as individual (existing functionality)
2. Test applying for events as individual (existing functionality)
3. Compare with band actions

**Expected Results:**
- Individual actions should work as before
- Band actions should be clearly distinguished
- No conflicts between individual and band functionality

## Database Verification

### Check Events Table
```sql
-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('band_id', 'posted_by_type');

-- Check for band events
SELECT e.title, e.posted_by_type, b.name as band_name
FROM events e
LEFT JOIN bands b ON e.band_id = b.id
WHERE e.posted_by_type = 'band';
```

### Check Bookings Table
```sql
-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('band_id', 'applied_by_type');

-- Check for band applications
SELECT b.id, b.applied_by_type, band.name as band_name
FROM bookings b
LEFT JOIN bands band ON b.band_id = band.id
WHERE b.applied_by_type = 'band';
```

### Check RLS Policies
```sql
-- Verify RLS policies are updated
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('events', 'bookings')
ORDER BY tablename, policyname;
```

## Common Issues and Solutions

### Issue: BandActionSelector doesn't appear
**Solution:** Check that user is a leader of at least one band

### Issue: Cannot post events as band
**Solution:** Verify RLS policies are updated and user is band leader

### Issue: Band information not displaying
**Solution:** Check that band data is being loaded correctly in components

### Issue: Database errors
**Solution:** Ensure migration has been run successfully

## Performance Testing

### Load Testing
1. Create multiple band events
2. Create multiple band applications
3. Test loading events board with many band events
4. Test loading applications with many band applications

### Expected Performance:
- Events board should load within 2-3 seconds
- Applications should load within 1-2 seconds
- No significant performance degradation with band data

## Security Testing

### Access Control
1. Try to access band events you don't lead
2. Try to modify band applications you don't own
3. Try to post events for bands you don't lead

### Expected Results:
- All unauthorized access should be blocked
- RLS policies should prevent data leakage
- Proper error messages should be shown

## Browser Compatibility

Test the functionality in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Responsiveness

Test the BandActionSelector and forms on:
- Mobile devices
- Tablets
- Different screen sizes

## Conclusion

After completing all test scenarios, the band events functionality should be working correctly. If any issues are found, refer to the troubleshooting section in the main documentation.
