import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import CheckoutPage from './pages/CheckoutPage'
import ChoosePlanPage from './pages/ChoosePlanPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      {/* Protected routes */}
      <Route
        path="/choose-plan"
        element={
          <>
            <SignedIn>
              <ChoosePlanPage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-up" replace />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/checkout"
        element={
          <>
            <SignedIn>
              <CheckoutPage />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <Dashboard />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
        }
      />
    </Routes>
  )
}

export default App
