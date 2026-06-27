import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import NewListing from "./pages/NewListing";
import EditListing from "./pages/EditListing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import Filter from "./pages/Filter";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import TripPlanner from "./pages/TripPlanner";
import AIChat from "./pages/AIChat";
import Recommendations from "./pages/Recommendations";
import Waitlist from "./pages/Waitlist";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <main className="container mt-3">
            <Routes>
              <Route path="/" element={<Navigate to="/listings" replace />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/new" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/listings/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/search" element={<Search />} />
              <Route path="/filter" element={<Filter />} />
              <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
              <Route path="/trips" element={<TripPlanner />} />
              <Route path="/ai" element={<AIChat />} />
              <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
              <Route path="/waitlist" element={<ProtectedRoute><Waitlist /></ProtectedRoute>} />
              <Route path="/pay/:bookingId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
              <Route path="/payments/:id/receipt" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
              <Route path="*" element={<div className="text-center py-5"><h3>Page not found</h3></div>} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
