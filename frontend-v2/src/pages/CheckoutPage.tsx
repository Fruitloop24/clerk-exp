import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * CheckoutPage - Handles automatic redirect to Stripe checkout
 *
 * This page is the bridge between signup and payment:
 * 1. User signs up with ?plan=X parameter
 * 2. Clerk redirects here after signup completes
 * 3. We create Stripe checkout session with correct tier
 * 4. Redirect to Stripe payment
 * 5. After payment, Stripe redirects to /dashboard
 */
export default function CheckoutPage() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiateCheckout = async () => {
      // Wait for auth to load
      if (!authLoaded || !userLoaded) return;

      // Must be signed in to checkout
      if (!user) {
        console.error('No user found, redirecting to signup');
        navigate('/sign-up');
        return;
      }

      const plan = searchParams.get('plan');

      // If no plan specified, go to dashboard
      if (!plan || plan === 'free') {
        navigate('/dashboard');
        return;
      }

      console.log(`Initiating checkout for ${plan} tier...`);

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
        const token = await getToken({ template: 'pan-api' });

        const response = await fetch(`${API_URL}/api/create-checkout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tier: plan }),
        });

        const data = await response.json();

        if (response.ok && data.url) {
          console.log('Redirecting to Stripe:', data.url);
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          console.error('Failed to create checkout session:', data);
          setError('Failed to create checkout session. Please try again.');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        setError('Something went wrong. Please try again.');
      }
    };

    initiateCheckout();
  }, [authLoaded, userLoaded, user, searchParams, getToken, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px'
    }}>
      {error ? (
        <div style={{
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>⚠️</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#dc2626'
          }}>Checkout Error</h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '24px'
          }}>{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#1e293b'
          }}>Preparing your checkout...</h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b'
          }}>You'll be redirected to Stripe in a moment</p>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
