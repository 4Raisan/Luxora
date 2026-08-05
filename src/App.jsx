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
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
