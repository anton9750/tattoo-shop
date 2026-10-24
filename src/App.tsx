import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import ArtistProfile from './pages/ArtistProfile'
import ForArtists from './pages/ForArtists'
import ArtistSignup from './pages/ArtistSignup'
import ArtistLogin from './pages/ArtistLogin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import Contact from './pages/Contact'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tatovor/:artistId" element={<ArtistProfile />} />
        <Route path="for-tatovorer" element={<ForArtists />} />
        <Route path="for-tatovorer/opret" element={<ArtistSignup />} />
        <Route path="log-ind" element={<ArtistLogin />} />
        <Route path="glemt-adgangskode" element={<ForgotPassword />} />
        <Route path="nulstil-adgangskode" element={<ResetPassword />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="om-os" element={<About />} />
        <Route path="kontakt" element={<Contact />} />
        <Route path="vilkar" element={<Terms />} />
        <Route path="privatlivspolitik" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
