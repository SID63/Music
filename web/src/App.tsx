import { BrowserRouter, Route, Routes, Link, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'
import MusicianDirectory from './pages/MusicianDirectory'
import MusicianProfile from './pages/MusicianProfile'
import EventsBoard from './pages/EventsBoard'
import EventPostForm from './pages/EventPostForm'
import EventEditPage from './pages/EventEditPage'
import EventApplicationsPage from './pages/EventApplicationsPage'
import ProfileEdit from './pages/ProfileEdit'
import ProfilePage from './pages/ProfilePage'
import BandsPage from './pages/BandsPage'
import BandDetailPage from './pages/BandDetailPage'
import BandCreatePage from './pages/BandCreatePage'
import MessagesPage from './pages/MessagesPage'
import ReviewsPage from './pages/ReviewsPage'
import ReviewForm from './components/ReviewForm'
import ProfileGuard from './components/ProfileGuard'
import ProfileSetup from './components/ProfileSetup'
import LoadingScreen from './components/LoadingScreen'
import DefaultRedirect from './components/DefaultRedirect'
import AuthNav from './components/AuthNav'
import MainNav from './components/MainNav'
import ConnectionTest from './components/ConnectionTest'
import SimpleEventForm from './components/SimpleEventForm'
import EventCreationTest from './components/EventCreationTest'
import EventApplicationTest from './components/EventApplicationTest'
import BandLeadershipTest from './components/BandLeadershipTest'
import { useState } from 'react'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen message="Checking authentication..." showRetry={true} />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ReviewFormWrapper() {
  const { profileId } = useParams();
  return <ReviewForm revieweeProfileId={profileId || ''} />;
}


function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Connect Musicians with
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Events</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Find talented musicians for your next event, or showcase your skills to potential clients. 
          Book securely, manage schedules, and create amazing musical experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/musicians" 
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Find Musicians
          </Link>
          <Link 
            to="/signup" 
            className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-lg"
          >
            Join as Musician
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Music Connect?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎵</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Musicians</h3>
            <p className="text-gray-600">Browse profiles with samples, reviews, and verified credentials</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Booking</h3>
            <p className="text-gray-600">Simple scheduling and secure payment processing</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Direct Communication</h3>
            <p className="text-gray-600">Message musicians directly and discuss event details</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white mb-16">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-6 opacity-90">Join thousands of musicians and event organizers</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/signup" 
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Sign Up Free
          </Link>
          <Link 
            to="/musicians" 
            className="px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
          >
            Browse Musicians
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoginPage() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    
    const { error } = await signIn(email, password)
    if (error) {
      if (error.includes('Invalid login credentials')) {
        alert('Invalid email or password. Please check your credentials and try again.')
      } else {
        alert('Login failed: ' + error)
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your Music Connect account</p>
      </div>
      
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input 
            name="email" 
            type="email" 
            placeholder="Enter your email" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input 
            name="password" 
            type="password" 
            placeholder="Enter your password" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            required 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

function SignupPage() {
  const { signUp } = useAuth()
  const [signingUp, setSigningUp] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSigningUp(true)
    
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const role = String(form.get('role')) as 'musician' | 'organizer'
    
    const { error } = await signUp(email, password, role, false)
    
    if (!error) {
      setSignupComplete(true)
    } else {
      if (error.includes('User already registered')) {
        alert('An account with this email already exists. Please try signing in instead.')
      } else if (error.includes('Password should be at least')) {
        alert('Password must be at least 6 characters long.')
      } else if (error.includes('Invalid email')) {
        alert('Please enter a valid email address.')
      } else {
        alert('Signup failed: ' + error)
      }
    }
    
    setSigningUp(false)
  }

  if (signupComplete) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="text-green-600 text-6xl">✓</div>
        <h2 className="text-2xl font-semibold">Check Your Email!</h2>
        <p className="text-gray-600">
          We've sent you a verification email. Once you verify your email and log in, 
          your profile will be automatically created with the role you selected.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-sm text-blue-800">
            <strong>What happens next:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Check your email and click the verification link</li>
            <li>• Come back and log in with your credentials</li>
            <li>• Your profile will be automatically created</li>
            <li>• You can then edit and complete your profile details</li>
          </ul>
        </div>
        <Link to="/login" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Join Music Connect as a musician or event organizer</p>
      </div>
      
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
          <select 
            name="role" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="musician">Musician</option>
            <option value="organizer">Event Organizer</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input 
            name="email" 
            type="email" 
            placeholder="Enter your email" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input 
            name="password" 
            type="password" 
            placeholder="Create a password" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
            required 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={signingUp}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {signingUp ? 'Creating Account...' : 'Create Account'}
        </button>
        
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center gap-4">
                  <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                      <span className="text-white font-bold text-2xl filter drop-shadow-sm">🎵</span>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Music Connect</span>
                  </Link>
                </div>

                <MainNav />

                <div className="md:hidden">
                  {/* Mobile menu button */}
                  <button className="p-3 rounded-2xl border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <AuthNav />
                </div>
              </div>
            </div>
          </nav>

          <main className="py-8">
            <DefaultRedirect />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/musicians" element={<MusicianDirectory />} />
              <Route path="/musicians/:id" element={<MusicianProfile />} />
              <Route path="/events" element={<EventsBoard />} />
              <Route path="/events/post" element={
                <RequireAuth>
                  <ProfileGuard feature="posting events" allowedRoles={['organizer', 'musician']}>
                    <EventPostForm />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/events/edit/:eventId" element={
                <RequireAuth>
                  <ProfileGuard feature="posting events" allowedRoles={['organizer', 'musician']}>
                    <EventEditPage />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/events/applications/:eventId" element={
                <RequireAuth>
                  <ProfileGuard feature="posting events" allowedRoles={['organizer', 'musician']}>
                    <EventApplicationsPage />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/profile" element={
                <RequireAuth>
                  <ProfileGuard requireComplete={false}>
                    <ProfilePage />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/profile/edit" element={
                <RequireAuth>
                  <ProfileGuard requireComplete={false}>
                    <ProfileEdit />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/setup" element={
                <RequireAuth>
                  <ProfileGuard requireComplete={false}>
                    <ProfileSetup />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/messages" element={
                <RequireAuth>
                  <ProfileGuard feature="messaging">
                    <MessagesPage />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/reviews/:musicianId" element={
                <RequireAuth>
                  <ReviewsPage />
                </RequireAuth>
              } />
              <Route path="/reviews/add/:profileId" element={
                <RequireAuth>
                  <ProfileGuard feature="writing reviews">
                    <ReviewFormWrapper />
                  </ProfileGuard>
                </RequireAuth>
              } />
              <Route path="/bands" element={
                <RequireAuth>
                  <BandsPage />
                </RequireAuth>
              } />
              <Route path="/bands/:bandId" element={
                <RequireAuth>
                  <BandDetailPage />
                </RequireAuth>
              } />
              <Route path="/bands/create" element={
                <RequireAuth>
                  <ProfileGuard feature="creating bands">
                    <BandCreatePage />
                  </ProfileGuard>
                </RequireAuth>
              } />

<Route path="/test-connection" element={<ConnectionTest />} />
<Route path="/simple-event" element={<SimpleEventForm />} />
<Route path="/event-test" element={<EventCreationTest />} />
<Route path="/application-test" element={<EventApplicationTest />} />
<Route path="/band-leadership-test" element={<BandLeadershipTest />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}



