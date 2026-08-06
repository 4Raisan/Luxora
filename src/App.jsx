import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Services from './components/Services'
import About from './components/About'
import Membership from './components/Membership'
import Footer from './components/Footer'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProviderRegister from './pages/ProviderRegister'
import ProviderDashboard from './pages/ProviderDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import BookService from './pages/BookService'
import Reviews from './pages/Reviews'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

// Main landing page layout
const HomePage = () => (
  <>
    <Navbar />
    <main>
      <Hero />
      <Stats />
      <Services />
      <About />
      <Membership />
    </main>
    <Footer />
  </>
)

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/provider-register" element={<ProviderRegister />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/book" element={<BookService />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
