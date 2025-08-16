import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

type MessageButtonProps = {
  recipientProfileId: string;
  recipientName: string;
  className?: string;
  eventContext?: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation?: string;
    isJobApplication?: boolean;
  };
  labelOverride?: string;
};

export default function MessageButton({ 
  recipientProfileId, 
  recipientName, 
  className = "", 
  eventContext, 
  labelOverride
}: MessageButtonProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [quotation, setQuotation] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // Function to update template with current values
  const updateTemplate = useCallback(() => {
    if (!eventContext?.isJobApplication) return;
    
    const userName = profile?.display_name || 'A Musician';
    let updatedTemplate = messageContent;
    
    // Update quotation placeholder
    if (updatedTemplate.includes('[Enter your quote amount here]')) {
      updatedTemplate = updatedTemplate.replace('[Enter your quote amount here]', quotation || '[Enter your quote amount here]');
    }
    
    // Update requirements placeholder
    if (updatedTemplate.includes('[Any specific equipment, setup, or other requirements you need]')) {
      updatedTemplate = updatedTemplate.replace('[Any specific equipment, setup, or other requirements you need]', additionalRequirements || '[Any specific equipment, setup, or other requirements you need]');
    }
    
    setMessageContent(updatedTemplate);
  }, [eventContext?.isJobApplication, messageContent, quotation, additionalRequirements, profile?.display_name]);



  const handleMessage = () => {
    if (!profile || profile.id === recipientProfileId) return;



    // Get user's display name for template
    const userName = profile?.display_name || 'A Musician';

    // Generate template message content
    let templateMessage = `Hi ${recipientName}! 👋

I'm reaching out because I'm interested in working with you. I'm a professional musician looking for new opportunities and collaborations.

🎵 **About Me:**
I have experience in various musical styles and event types, and I'm always excited to connect with other professionals in the industry.

💬 **Let's Connect:**
I'd love to learn more about your work and discuss potential opportunities. Please let me know:
• What type of projects you're working on
• Any upcoming events or collaborations
• How we might work together

Looking forward to hearing from you!

Best regards,
${userName}`;
    
    // Add event context if provided
    if (eventContext) {
      if (eventContext.isJobApplication) {
        templateMessage = `Hi ${recipientName}! 👋

I'm reaching out regarding your event and would love to discuss how I can contribute to making it special.

🎵 **About Me:**
I'm a professional musician with experience in various genres and event types. I'm excited about the opportunity to contribute to your event and ensure it's a memorable experience for your guests.

💰 **What I Offer:**
• Professional performance tailored to your event
• Flexible repertoire to match your vision
• Reliable equipment and setup
• Professional attitude and punctuality

💵 **My Quote:**
${quotation || '[Enter your quote amount here]'}

📋 **Additional Requirements:**
${additionalRequirements || '[Any specific equipment, setup, or other requirements you need]'}

📋 **Next Steps:**
I'd love to discuss the details of your event, including:
• Performance requirements and timing
• Musical style preferences
• Budget considerations
• Any specific requests you have

Please let me know if you'd like to see my portfolio, discuss rates, or have any questions about how I can contribute to making your event special.

Looking forward to hearing from you!

Best regards,
${userName}`;
      } else {
        templateMessage = `Hi ${recipientName}! 👋

I'm reaching out regarding your event and would love to discuss how I can contribute to making it successful.

🎯 **My Interest:**
I'd love to discuss how I can contribute to your event. Whether you need a performer, technical support, or have other requirements, I'm here to help make your event successful.

💬 **Let's Connect:**
I'd appreciate the opportunity to learn more about your vision and discuss how we might work together. Please let me know:
• What you're looking for
• Any specific requirements
• How I can best support your event

Looking forward to hearing from you!

Best regards,
${userName}`;
      }
    }

    // Replace placeholders in the template
    let finalTemplate = templateMessage;
    
    // Replace [Your Name] with actual user name if it exists in template
    if (finalTemplate.includes('[Your Name]')) {
      finalTemplate = finalTemplate.replace(/\[Your Name\]/g, userName);
    }
    
    // Set the template message and show modal
    setMessageContent(finalTemplate);
    setShowModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;

    // For job applications, require quotation
    if (eventContext?.isJobApplication && !quotation.trim()) {
      alert('Please enter your quote amount before submitting the application.');
      return;
    }

    setSending(true);
    try {
      // Combine event details with user's message
      let finalMessage = messageContent.trim();
      
      if (eventContext) {
        const eventDetails = `\n\n--- Event Details ---\nEvent: ${eventContext.eventTitle}\nDate: ${eventContext.eventDate}${eventContext.eventLocation ? `\nLocation: ${eventContext.eventLocation}` : ''}\n---`;
        finalMessage += eventDetails;
      }

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_profile_id: profile?.id || '',
          recipient_profile_id: recipientProfileId,
          content: finalMessage
        });

      if (messageError) {
        console.error('Message insert error:', messageError);
        throw new Error(`Failed to send message: ${messageError.message}`);
      }

      // Initialize isNewQuotation variable for job applications
      let isNewQuotation = false;

      // If this is a job application, also save to bookings table
      if (eventContext?.isJobApplication && eventContext.eventId) {
        // Check if there's an existing booking for this event and musician
        const { data: existingBooking, error: checkError } = await supabase
          .from('bookings')
          .select('id, status, quotation')
          .eq('event_id', eventContext.eventId)
          .eq('musician_profile_id', profile?.id || '')
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing booking:', checkError);
          // Continue with the process even if check fails
        }

        // Check if this is a new quotation
        isNewQuotation = !existingBooking;

        const { error: bookingError } = await supabase
          .from('bookings')
          .upsert({
            event_id: eventContext.eventId,
            musician_profile_id: profile?.id || '',
            quotation: quotation ? parseFloat(quotation) : null,
            additional_requirements: additionalRequirements || null,
            // Reset status to pending if this is a new quotation after being declined
            status: isNewQuotation ? 'pending' : (existingBooking?.status || 'pending')
          }, {
            onConflict: 'event_id,musician_profile_id'
          });

        if (bookingError) {
          console.error('Error saving booking:', bookingError);
          // Don't throw error here as message was sent successfully, but log it
        }
      }

      // Close modal and reset form
      setShowModal(false);
      setMessageContent('');
      setQuotation('');
      setAdditionalRequirements('');
      
      const params = new URLSearchParams();
      params.set('conversation', recipientProfileId);
      navigate(`/messages?${params.toString()}`);
      
      // Show success message
      if (eventContext?.isJobApplication) {
        const statusMessage = isNewQuotation ? 
          `New quote submitted! Your updated quote of $${quotation || 'TBD'} has been sent to the event organizer for review.` :
          `Quote application submitted successfully! Your quote of $${quotation || 'TBD'} has been sent to the event organizer.`;
        alert(`${statusMessage} Redirecting to conversation...`);
      } else {
        alert('Message sent successfully! Redirecting to conversation...');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setSending(false);
    }
  };

  // Don't show if no profile (user not authenticated)
  if (!profile) {
    return null;
  }

  // Don't show message button if user is messaging themselves
  if (profile?.id === recipientProfileId) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleMessage}
        disabled={sending}
        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${className}`}
      >
        {sending ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {labelOverride ?? (eventContext?.isJobApplication ? 'Submit Quote' : 'Message')}
          </>
        )}
      </button>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {eventContext?.isJobApplication ? 'Submit Quote & Application' : 'Send Message'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setMessageContent('');
                  setQuotation('');
                  setAdditionalRequirements('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700 mb-2">
                Message to {recipientName}
              </label>
              
              {/* Event Details Section (Read-only) */}
              {eventContext && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Event Details (Read-only)</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><span className="font-medium">Event:</span> {eventContext.eventTitle}</div>
                    <div><span className="font-medium">Date:</span> {eventContext.eventDate}</div>
                    {eventContext.eventLocation && (
                      <div><span className="font-medium">Location:</span> {eventContext.eventLocation}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Quotation and Requirements Fields for Job Applications */}
              {eventContext?.isJobApplication && (
                <div className="mb-4 space-y-4">
                  <div>
                    <label htmlFor="quotation" className="block text-sm font-medium text-gray-700 mb-2">
                      💵 Your Quote Amount (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="quotation"
                      value={quotation}
                                              onChange={(e) => {
                          setQuotation(e.target.value);
                        }}
                      min="0"
                      step="0.01"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        quotation.trim() ? 'border-gray-300' : 'border-red-300 bg-red-50'
                      }`}
                      placeholder="Enter your quote amount"
                    />
                    {!quotation.trim() && (
                      <p className="text-sm text-red-600 mt-1">Quote amount is required for job applications</p>
                    )}
                  </div>
                  
                                      <div>
                      <label htmlFor="additionalRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                        📋 Additional Requirements
                      </label>
                      <textarea
                        id="additionalRequirements"
                        value={additionalRequirements}
                        onChange={(e) => {
                          setAdditionalRequirements(e.target.value);
                        }}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Any specific equipment, setup, or other requirements you need..."
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={updateTemplate}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      🔄 Update Template Preview
                    </button>
                </div>
              )}
              
              <textarea
                id="messageContent"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your message here..."
              />
              
              {/* Live preview of how the message will look */}
              {eventContext?.isJobApplication && (quotation || additionalRequirements) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Application Summary:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    {quotation && <div><strong>Quote:</strong> ${quotation}</div>}
                    {additionalRequirements && <div><strong>Requirements:</strong> {additionalRequirements}</div>}
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
                    This will be submitted as a formal application to the event organizer.
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6 sticky bottom-0 bg-white pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  setMessageContent('');
                  setQuotation('');
                  setAdditionalRequirements('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !messageContent.trim() || (eventContext?.isJobApplication && !quotation.trim())}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  eventContext?.isJobApplication ? 'Submit Quote' : 'Send Message'
                )}
              </button>
            </div>
            

          </div>
        </div>
      )}
    </>
  );
}
