import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Discover } from './pages/Discover';
import { LandmarkDetail } from './pages/LandmarkDetail';
import { Booking } from './pages/Booking';
import { Profile } from './pages/Profile';
import { TripDetails } from './pages/TripDetails';
import { PublicProfile } from './pages/PublicProfile';
import { Community } from './pages/Community';
import { About } from './pages/About';
import { Help } from './pages/Help';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFound } from './pages/NotFound';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserCollectionsProvider } from './contexts/UserCollectionsContext';
import { ToastStack } from './components/ToastStack';
export function App() {
  return (
    <ThemeProvider>
      <UserCollectionsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="discover" element={<Discover />} />
              <Route path="landmark/:id" element={<LandmarkDetail />} />
              <Route path="book/:id" element={<Booking />} />
              <Route path="profile" element={<Profile />} />
              <Route path="trip/:id" element={<TripDetails />} />
              <Route path="user/:id" element={<PublicProfile />} />
              <Route path="community" element={<Community />} />
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