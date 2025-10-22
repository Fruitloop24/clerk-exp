import { SignUp } from '@clerk/clerk-react'
import { useSearchParams } from 'react-router-dom'

export default function SignUpPage() {
  const [searchParams] = useSearchParams()
  const plan = searchParams.get('plan')

  // If user is signing up with a paid plan intent, redirect to checkout
  // Otherwise, go straight to dashboard
  const afterSignUpUrl = plan && plan !== 'free'
    ? `/checkout?plan=${plan}`
    : '/dashboard'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl={afterSignUpUrl}
      />
    </div>
  )
}
