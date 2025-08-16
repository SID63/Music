import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, X } from 'lucide-react';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/skeletons/EventCardSkeleton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import MyApplicationsManager from '../components/MyApplicationsManager';
import EventApplicationsManager from '../components/EventApplicationsManager';
import { eventService } from '../services/eventService';
import type { Event as ServiceEvent } from '../services/eventService';

type Event = ServiceEvent;

export default function EventsBoard() {
  const { profile, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  // Advanced Filters & Sort UI
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'budget_desc' | 'budget_asc' | 'title_asc'>('date_asc');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    budgetMin: '',
    budgetMax: '',
    locationQuery: '',
    withBudget: false,
    upcomingOnly: false,
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load all events with details
        const { data: allEvents } = await eventService.getEvents();
        setEvents(allEvents || []);

        // Load user's events (includes band-leader events)
        const ownerId = profile?.id || user?.id;
        if (ownerId) {
          const { data: mine } = await eventService.getUserEvents(ownerId);
          setMyEvents(mine || []);
        } else {
          setMyEvents([]);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user, profile]);

  // Precompute unique sets (none needed beyond current schema)

  // Filter events based on search, basic and advanced filters
  const filteredEvents = events.filter(event => {
    if (!event) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      (event.title?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower));
      
    // Advanced: date range
    const fromOk = !filters.dateFrom || (event.starts_at && new Date(event.starts_at) >= new Date(filters.dateFrom));
    const toOk = !filters.dateTo || (event.starts_at && new Date(event.starts_at) <= new Date(filters.dateTo));
    // Advanced: budget
    const minBudget = filters.budgetMin ? parseFloat(filters.budgetMin) : undefined;
    const maxBudget = filters.budgetMax ? parseFloat(filters.budgetMax) : undefined;
    const budget = event.budget_min ?? event.budget_max ?? 0;
    const budgetOk = (minBudget === undefined || budget >= minBudget) && (maxBudget === undefined || budget <= maxBudget);
    // Advanced: location contains
    const locationOk = !filters.locationQuery || (event.location || '').toLowerCase().includes(filters.locationQuery.toLowerCase());
    // Advanced: with budget
    const withBudgetOk = !filters.withBudget || !!(event.budget_min || event.budget_max);
    // Advanced: upcoming only
    const upcomingOk = !filters.upcomingOnly || (event.starts_at && new Date(event.starts_at) >= new Date());
    
    return matchesSearch && fromOk && toOk && budgetOk && locationOk && withBudgetOk && upcomingOk;
  });
  
  // Apply sorting
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const getBudget = (e: Event) => (e.budget_min ?? 0) || (e.budget_max ?? 0);
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime();
      case 'budget_desc':
        return getBudget(b) - getBudget(a);
      case 'budget_asc':
        return getBudget(a) - getBudget(b);
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'date_asc':
      default:
        return new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime();
    }
  });

  return (
    <div className="container py-6 px-3 sm:px-0 space-y-6">
      {/* Header with Title and Actions */}
      <div className="ui-glass ui-vibrant-border rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ui-noise bg-card/80 border border-border shadow-md">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Discover and manage upcoming gigs and opportunities</p>
        </div>
        {(profile?.role === 'organizer' || profile?.role === 'musician') && (
          <Link to="/events/new">
            <Button className="w-full sm:w-auto min-h-11">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 ui-glass ui-vibrant-border rounded-xl p-4 sm:p-5 ui-noise bg-card/70 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events..."
              className="w-full pl-10 placeholder:text-muted-foreground/80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputMode="search"
              autoComplete="on"
            />
          </div>
          
          <div className="sm:hidden grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full min-h-11"
              onClick={() => setIsSortOpen(true)}
            >
              Sort
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full min-h-11"
              onClick={() => setIsMobileFiltersOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          
          <div className="hidden sm:flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={() => setIsSortOpen(true)}>
              Sort
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsAdvancedFiltersOpen(true)}>
              More filters
            </Button>
            
            {(searchTerm) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                }}
                className="whitespace-nowrap"
              >
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Mobile filters */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:hidden">
            <div className="ui-glass ui-vibrant-border rounded-lg w-full max-w-md max-h-[80vh] flex flex-col ui-noise bg-card/90 border border-border shadow-xl">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Date from</label>
                      <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Date to</label>
                      <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Budget min (₹)</label>
                      <Input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 100" value={filters.budgetMin} onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Budget max (₹)</label>
                      <Input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 1000" value={filters.budgetMax} onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Location contains</label>
                      <Input placeholder="City, venue, etc." value={filters.locationQuery} onChange={(e) => setFilters({ ...filters, locationQuery: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" type="checkbox" checked={filters.withBudget} onChange={(e) => setFilters({ ...filters, withBudget: e.target.checked })} />
                      Has budget
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" type="checkbox" checked={filters.upcomingOnly} onChange={(e) => setFilters({ ...filters, upcomingOnly: e.target.checked })} />
                      Upcoming only
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                  }}
                >
                  Reset
                </Button>
                <Button onClick={() => setIsMobileFiltersOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {isLoading ? 'Loading events...' : `Events ${filteredEvents.length > 0 ? `(${filteredEvents.length})` : ''}`}
          </h2>
          
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
        </div>

        {/* All Events Tab */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10 sm:py-12 ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise bg-card/70 border border-border shadow-sm">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No events found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or filters' 
                  : 'Check back later for new events'}
              </p>
              {(searchTerm) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {sortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Events Tab */}
        <TabsContent value="my-events">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(3)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : myEvents.length === 0 ? (
            <div className="text-center py-10 sm:py-12 ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No events yet
              </h3>
              <p className="text-muted-foreground mb-6">
                {profile?.role === 'organizer' || profile?.role === 'musician'
                  ? 'Create your first event to get started!'
                  : 'You need to be logged in to view your events'}
              </p>
              {(profile?.role === 'organizer' || profile?.role === 'musician') && (
                <Link to="/events/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          {!profile ? (
            <div className="text-center py-10 sm:py-12 ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-medium text-foreground mb-1">Sign in to view applications</h3>
              <p className="text-muted-foreground">You need to be logged in to manage or view applications.</p>
            </div>
          ) : (
            <Tabs
              // Default: musicians see My Applications, organizers see For My Events
              defaultValue={profile.role === 'organizer' ? 'for-events' : 'mine'}
              className="w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-xl font-semibold">Applications</h3>
                <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                  <TabsTrigger value="mine" disabled={profile.role !== 'musician'}>
                    My Applications
                  </TabsTrigger>
                  <TabsTrigger value="for-events">
                    For My Events
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="mine">
                {profile.role === 'musician' ? (
                  <MyApplicationsManager />
                ) : (
                  <div className="text-center py-10 sm:py-12 ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">
                    <div className="text-6xl mb-4">🎵</div>
                    <h4 className="text-base font-medium text-foreground mb-1">Musician access required</h4>
                    <p className="text-muted-foreground">Only musicians have personal applications.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="for-events">
                {(profile.role === 'organizer' || profile.role === 'musician') ? (
                  <EventApplicationsManager events={myEvents as any} userRole={profile.role} />
                ) : (
                  <div className="text-center py-10 sm:py-12 ui-glass ui-vibrant-border rounded-xl p-6 sm:p-8 ui-noise">
                    <div className="text-6xl mb-4">📅</div>
                    <h4 className="text-base font-medium text-foreground mb-1">No event access</h4>
                    <p className="text-muted-foreground">You don't have events to manage.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* Sort Modal */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="ui-glass ui-vibrant-border rounded-lg w-full max-w-md max-h-[80vh] flex flex-col ui-noise bg-card/90 border border-border shadow-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">Sort</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsSortOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Sort by</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_asc">Date (Soonest first)</SelectItem>
                    <SelectItem value="date_desc">Date (Latest first)</SelectItem>
                    <SelectItem value="budget_desc">Budget (High to Low)</SelectItem>
                    <SelectItem value="budget_asc">Budget (Low to High)</SelectItem>
                    <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSortBy('date_asc')}>Reset</Button>
              <Button onClick={() => setIsSortOpen(false)}>Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {isAdvancedFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="ui-glass ui-vibrant-border rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col ui-noise bg-card/90 border border-border shadow-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-medium">Advanced Filters</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAdvancedFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date from</label>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date to</label>
                  <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Budget min (₹)</label>
                  <Input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 100" value={filters.budgetMin} onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Budget max (₹)</label>
                  <Input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 1000" value={filters.budgetMax} onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Location contains</label>
                  <Input placeholder="City, venue, etc." value={filters.locationQuery} onChange={(e) => setFilters({ ...filters, locationQuery: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" type="checkbox" checked={filters.withBudget} onChange={(e) => setFilters({ ...filters, withBudget: e.target.checked })} />
                  Has budget
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" type="checkbox" checked={filters.upcomingOnly} onChange={(e) => setFilters({ ...filters, upcomingOnly: e.target.checked })} />
                  Upcoming only
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => setFilters({
                  dateFrom: '', dateTo: '', budgetMin: '', budgetMax: '', locationQuery: '', withBudget: false, upcomingOnly: false
                })}
              >
                Reset
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAdvancedFiltersOpen(false)}>Close</Button>
                <Button onClick={() => setIsAdvancedFiltersOpen(false)}>Apply</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
