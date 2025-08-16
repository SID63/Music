import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format, isValid } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import type { Event as ServiceEvent } from '@/services/eventService';
import MessageButton from '@/components/MessageButton';

type Event = ServiceEvent;

// Simple expandable text for long content blocks
function ExpandableText({ text, maxChars = 280, className = '' }: { text: string; maxChars?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const tooLong = text.length > maxChars;
  const shown = expanded || !tooLong ? text : text.slice(0, maxChars) + '…';
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{shown}</p>
      {tooLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('');
  const [hostLink, setHostLink] = useState<string>('');
  const [hostAvatarUrl, setHostAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        const ev = data as Event;
        setEvent(ev);

        // Resolve host info (organizer profile only)
        if (ev.organizer_profile_id) {
          const { data: organizer } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', ev.organizer_profile_id)
            .single();
          setHostName(organizer?.display_name || 'Organizer');
          setHostLink(`/musicians/${ev.organizer_profile_id}`);
          setHostAvatarUrl(organizer?.avatar_url || null);
        } else {
          setHostName('Organizer');
          setHostLink('');
          setHostAvatarUrl(null);
        }
      } catch (e: any) {
        console.error('Failed to load event', e);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApply = async () => {
    try {
      // TODO: Implement application logic
      toast({
        title: 'Application submitted!',
        description: 'Your application has been received.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isOwner = !!event && user?.id === event.organizer_profile_id;
  const safeDate = (s?: string | null) => {
    if (!s) return null;
    const d = new Date(s);
    return isValid(d) ? d : null;
  };
  const formattedDate = event?.starts_at ? format(safeDate(event.starts_at)!, 'MMMM d, yyyy') : 'Date not specified';
  const formattedTime = event?.starts_at
    ? `${format(safeDate(event.starts_at)!, 'h:mm a')}${event.ends_at ? ` - ${format(safeDate(event.ends_at)!, 'h:mm a')}` : ''}`
    : 'Time not specified';
  const formatCurrency = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `₹${n}`;
    }
  };

  return (
    <div className="container py-6 sm:py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 h-11 w-full sm:w-auto justify-start"
        aria-label="Go back to events"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Events
      </Button>
      {loading ? (
        <div className="text-center py-12 sm:py-16 text-muted-foreground ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">Loading event...</div>
      ) : error || !event ? (
        <div className="text-center py-12 sm:py-16 text-muted-foreground ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">Event not found.</div>
      ) : (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl text-foreground">{event.title}</CardTitle>
              <div className="flex flex-wrap items-center mt-2 gap-2"></div>
            </div>
            {isOwner && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/events/${event.id}/edit`)}
                className="h-11 sm:h-10 w-full sm:w-auto"
              >
                Edit Event
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick facts across the top */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Event Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Date & Time</p>
                  <p className="text-sm font-semibold text-foreground truncate">{formattedDate}</p>
                  <p className="text-xs text-muted-foreground truncate">{formattedTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Location</p>
                  <p className="text-sm font-semibold text-foreground truncate">{event.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 lg:col-span-1 sm:col-span-2">
                <div className="mt-0.5">
                  <Avatar className="size-8">
                    {hostAvatarUrl ? (
                      <AvatarImage src={hostAvatarUrl} alt={hostName || 'Host'} />
                    ) : (
                      <AvatarFallback>{(hostName || 'H').slice(0,2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Host</p>
                  <p className="text-sm font-semibold text-foreground truncate">{hostName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {event.organizer_profile_id && (
                      <MessageButton
                        recipientProfileId={event.organizer_profile_id}
                        recipientName={hostName || 'Organizer'}
                        className="h-9 sm:h-8 px-3 w-full sm:w-auto"
                        eventContext={{
                          eventId: event.id,
                          eventTitle: event.title,
                          eventDate: formattedDate,
                          eventLocation: event.location || undefined,
                          isJobApplication: false
                        }}
                        labelOverride="Message Host"
                      />
                    )}
                    {hostLink && (
                      <Link to={hostLink} className="w-full sm:w-auto">
                        <Button variant="outline" className="h-9 sm:h-8 px-3 w-full sm:w-auto">View Profile</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Long sections full-width below to avoid wasted column space */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">About the Event</h3>
            {event.description && (
              <ExpandableText text={event.description} />
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {(event.budget_min || event.budget_max) && (
                <div className="ui-glass ui-vibrant-border rounded-lg p-3 ui-noise bg-card/70 border border-border shadow-sm">
                  <dt className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Budget</dt>
                  <dd className="text-sm font-semibold text-foreground">
                    {event.budget_min && event.budget_max
                      ? `${formatCurrency(event.budget_min)} - ${formatCurrency(event.budget_max)}`
                      : event.budget_min
                        ? `From ${formatCurrency(event.budget_min)}`
                        : event.budget_max
                          ? `Up to ${formatCurrency(event.budget_max)}`
                          : ''}
                  </dd>
                </div>
              )}
            </dl>

            </div>
        </CardContent>
        
        <CardFooter className="border-t border-border pt-6">
          <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">Posted on {format(new Date(event.created_at), 'MMMM d, yyyy')}</div>
            {!isOwner && (
              <Link to={`/events/${event.id}/apply`} className="w-full sm:w-auto">
                <Button className="h-11 sm:h-10 w-full sm:w-auto">
                  Apply to Perform
                </Button>
              </Link>
            )}
            {isOwner && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/events/${event.id}/applications`)}
                className="h-11 sm:h-10 w-full sm:w-auto"
              >
                View Applications
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      )}
    </div>
  );
}
