import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import { MapPin, Calendar } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  location: string;
  starts_at: string | null;
  ends_at: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  [key: string]: any;
}

interface EventCardProps {
  event: Event;
  className?: string;
}

export default function EventCard({ event, className = '' }: EventCardProps) {
  const {
    id,
    title,
    location,
    starts_at,
    ends_at,
    budget_min,
    budget_max,
  } = event;

  const safeParseDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isValid(date) ? date : null;
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    const date = dateString ? safeParseDate(dateString) : null;
    return date ? format(date, 'MMM d, yyyy') : 'Date not specified';
  };

  const formatTime = (dateString: string | null) => {
    const date = dateString ? safeParseDate(dateString) : null;
    return date ? format(date, 'h:mm a') : 'Time not specified';
  };

  const formatTimeRange = (start: string | null, end: string | null) => {
    if (!start) return 'Time not specified';
    if (!end) return formatTime(start);
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <div className={`ui-glass ui-vibrant-border rounded-xl overflow-hidden transition-shadow duration-200 ui-noise ${className}`}>
      <Link to={`/events/${id}`} className="block h-full">
        <div className="p-3 sm:p-6 h-full flex flex-col">
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 line-clamp-2">
                {title}
              </h3>
            </div>

            <div className="mt-1.5 sm:mt-2 flex items-center text-sm text-muted-foreground">
              <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
              <span className="line-clamp-1">{location}</span>
            </div>

            <div className="mt-1.5 sm:mt-2 flex items-center text-sm text-muted-foreground">
              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
              {formatDate(starts_at)}
              {starts_at && (
                <>
                  <span className="mx-1">•</span>
                  {formatTimeRange(starts_at, ends_at || null)}
                </>
              )}
            </div>

            {(budget_min != null || budget_max != null) && (
              <div className="mt-1.5 sm:mt-2">
                <span className="text-sm font-medium text-foreground">
                  {budget_min && budget_max 
                    ? `₹${budget_min} - ₹${budget_max}` 
                    : budget_min 
                      ? `From ₹${budget_min}` 
                      : `Up to ₹${budget_max}`}
                </span>
              </div>
            )}

          </div>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">View details</span>
              <span className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
                Learn more
                <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
