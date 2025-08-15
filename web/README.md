# 🎵 Music Connect

A platform connecting musicians/bands with event organizers. Musicians can showcase their profiles with pricing and YouTube samples, while event organizers can browse and book talent for their events.

## ✨ Features

### 🎭 **User Types**
- **Musicians/Bands**: Individual artists or bands with profiles
- **Event Organizers**: Businesses or individuals hosting events

### 🔐 **Authentication & Profiles**
- Email/password authentication with Supabase Auth
- Automatic profile creation after email verification
- Profile picture uploads via Supabase Storage
- Location detection from device GPS
- Rich profile editing with musician-specific fields

### 🎵 **Musician Features**
- Profile customization (bio, genres, pricing, YouTube samples)
- Band vs. individual musician designation
- Pricing range (min/max)
- YouTube video embedding
- Genre tagging system

### 📅 **Event Management**
- Event organizers can post job listings
- Musicians can browse and apply for events
- Booking system with status tracking
- Double-booking prevention

### 🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
- Beautiful profile cards with images
- Advanced search and filtering
- Interactive location detection
- Professional landing page

## 🚀 Quick Start

### 1. **Supabase Setup**
```bash
# Create new Supabase project at https://supabase.com
# Get your project URL and anon key
```

### 2. **Environment Variables**
Create `.env` file in the `web` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. **Database Schema**
Run the SQL files in your Supabase SQL editor:
1. `supabase/schema.sql` - Main database tables and RLS policies
2. `supabase/storage.sql` - Storage bucket setup for profile pictures

### 4. **Install Dependencies**
```bash
cd web
npm install
```

### 5. **Start Development Server**
```bash
npm run dev
```

## 🗄️ Database Schema

### **Tables**
- `profiles` - User profiles with role, bio, location, pricing
- `events` - Event listings with budget and scheduling
- `bookings` - Event bookings with status tracking
- `messages` - Direct messaging between users
- `reviews` - Rating and review system

### **Key Features**
- Row Level Security (RLS) for data protection
- Double-booking prevention triggers
- Automatic timestamp management
- UUID primary keys for security

## 🔧 Configuration

### **Supabase Auth**
- Email confirmation required
- JWT tokens for authentication
- Automatic profile creation after verification

### **Storage Buckets**
- `avatars` - Profile picture storage
- Public read access
- User-specific upload permissions

### **Location Services**
- GPS integration for automatic location detection
- OpenStreetMap reverse geocoding
- Fallback to manual entry

## 📱 User Flow

### **For Musicians**
1. Sign up and verify email
2. Profile automatically created
3. Edit profile with bio, genres, pricing
4. Upload profile picture
5. Add YouTube samples
6. Browse and apply for events

### **For Event Organizers**
1. Sign up and verify email
2. Profile automatically created
3. Browse musician directory
4. Filter by genre, price, location
5. Post event listings
6. Manage bookings and communications

## 🎨 UI Components

### **Profile Management**
- Profile picture upload with preview
- Location detection with GPS
- Dynamic form fields based on user role
- Real-time validation and feedback

### **Musician Directory**
- Beautiful profile cards with images
- Advanced search and filtering
- Genre tags and pricing display
- YouTube sample integration

### **Navigation**
- Responsive header with profile dropdown
- Role-based navigation items
- Quick access to key features

## 🔒 Security Features

- Row Level Security (RLS) policies
- User authentication required for protected routes
- Profile data isolation between users
- Secure file upload validation
- JWT token management

## 🚀 Deployment

### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Deploy dist folder
```

### **Backend (Supabase)**
- Database and auth automatically deployed
- Edge functions for custom logic
- Real-time subscriptions for messaging

## 🐛 Troubleshooting

### **Common Issues**
1. **Profile not loading**: Check Supabase environment variables
2. **Image upload fails**: Verify storage bucket permissions
3. **Location not working**: Ensure HTTPS for GPS access
4. **Authentication errors**: Check Supabase Auth settings

### **Development Tips**
- Use browser dev tools to check console errors
- Verify Supabase connection in Network tab
- Check RLS policies for data access issues

## 🔮 Future Features

- [ ] Real-time messaging
- [ ] Payment processing
- [ ] Calendar integration
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Social features

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Supabase**
