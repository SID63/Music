import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import EventApplicationForm from '@/components/EventApplicationForm';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  location?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
}

export default function EventApplyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, starts_at, location, budget_min, budget_max')
          .eq('id', id)
          .single();
        if (error) throw error;
        setEvent(data as Event);
      } catch (e: any) {
        console.error('Failed to load event', e);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="container py-6 sm:py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 h-11 w-full sm:w-auto justify-start"
        aria-label="Go back"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back
      </Button>

      {loading ? (
        <div className="text-center py-12 sm:py-16 text-muted-foreground ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">Loading...</div>
      ) : error || !event ? (
        <div className="text-center py-12 sm:py-16 text-muted-foreground ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">Event not found.</div>
      ) : (
        <EventApplicationForm 
          event={event}
          onSuccess={() => navigate(`/events/${event.id}`)}
          onCancel={() => navigate(`/events/${event.id}`)}
        />
      )}
    </div>
  );
}
