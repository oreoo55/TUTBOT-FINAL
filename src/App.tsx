import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Discover } from './pages/Discover';
import { LandmarkDetail } from './pages/LandmarkDetail';
import { Booking } from './pages/Booking';

import { TripDetails } from './pages/TripDetails';
import { PublicProfile } from './pages/PublicProfile';

import { About } from './pages/About';
import { EgyptTimeline } from './pages/EgyptTimeline';
import { Help } from './pages/Help';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';

import { NotFound } from './pages/NotFound';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserCollectionsProvider } from './contexts/UserCollectionsContext';
import { ToastStack } from './components/ToastStack';
import { Suspense } from 'react';
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Community = React.lazy(() => import('./pages/Community'));
export function App() {
  return (
    <ThemeProvider>
      <UserCollectionsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" /></div>}><AdminDashboard /></Suspense>} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="discover" element={<Discover />} />
              <Route path="landmark/:id" element={<LandmarkDetail />} />
              <Route path="book/:id" element={<Booking />} />
              <Route path="profile" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" /></div>}><Profile /></Suspense>} />
              <Route path="trip/:id" element={<TripDetails />} />
              <Route path="user/:id" element={<PublicProfile />} />
              <Route path="community" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" /></div>}><Community /></Suspense>} />
              <Route path="egypt-history" element={<EgyptTimeline />} />
              <Route path="about" element={<About />} />
              <Route path="help" element={<Help />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <ToastStack />
        </BrowserRouter>
      </UserCollectionsProvider>
    </ThemeProvider>);

}