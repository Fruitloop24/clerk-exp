import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface Tier {
  id: string;
  name: string;
  price: number;
  limit: number | 'unlimited';
  hasPriceId: boolean;
}

export default function ChoosePlanPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
  const currentPlan = (user?.publicMetadata?.plan as string) || 'free';

  useEffect(() => {
    // Fetch available tiers from API
    const fetchTiers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tiers`);
        const data = await response.json();
        setTiers(data.tiers);
      } catch (err) {
        console.error('Failed to fetch tiers:', err);
        setError('Failed to load pricing options');
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, [API_URL]);

  const handleSelectPlan = async (tierId: string) => {
    // Free tier - just go to dashboard
    if (tierId === 'free') {
      navigate('/dashboard');
      return;
    }

    // Paid tier - create checkout session
    setUpgrading(tierId);
    try {
      const token = await getToken({ template: 'pan-api' });
      const response = await fetch(`${API_URL}/api/create-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session');
        setUpgrading(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong. Please try again.');
      setUpgrading(null);
    }
  };

  const getTierGradient = (tierId: string) => {
    switch (tierId) {
      case 'free':
        return 'bg-white border-2 border-slate-200';
      case 'plus':
        return 'bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700';
      case 'premium':
        return 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800';
      default:
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
    }
  };

  const getFeatures = (tier: Tier) => {
    const limitText = tier.limit === 'unlimited' ? 'Unlimited requests' : `${tier.limit} requests/month`;

    const features: string[] = [limitText];

    if (tier.id === 'plus') {
      features.push('more docs', 'more awesome');
    } else if (tier.id === 'premium') {
      features.push('priority support', 'integration');
    } else if (tier.id === 'free') {
      features.push('doc processing', 'parsing');
    }

    return features;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading pricing options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Select the plan that best fits your needs. You can upgrade or downgrade at any time.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier) => {
            const features = getFeatures(tier);
            const gradient = getTierGradient(tier.id);
            const isFree = tier.id === 'free';
            const isCurrent = tier.id === currentPlan;
            const isUpgrading = upgrading === tier.id;
            const textColor = isFree ? 'text-slate-700' : 'text-white';

            return (
              <div
                key={tier.id}
                className={`p-8 rounded-3xl ${gradient} ${
                  isFree ? '' : 'text-white'
                } hover:scale-105 transition-all shadow-2xl`}
              >
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-4 ${textColor}`}>
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    <span className={`text-6xl font-extrabold ${textColor}`}>
                      ${tier.price}
                    </span>
                    <span className={`text-xl ${isFree ? 'text-slate-600' : 'text-white/90'}`}>
                      /month
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className={`${isFree ? 'text-green-500' : 'text-green-300'} text-xl flex-shrink-0`}>
                        ✓
                      </span>
                      <span className={isFree ? 'text-slate-700' : 'text-white/95'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg ${
                      isFree
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        : 'bg-white/20 text-white cursor-not-allowed'
                    }`}
                  >
                    ✓ Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(tier.id)}
                    disabled={isUpgrading || !tier.hasPriceId}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                      isFree
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-purple-600 hover:bg-purple-50 shadow-xl'
                    } ${
                      isUpgrading || !tier.hasPriceId ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUpgrading
                      ? 'Loading...'
                      : isFree
                      ? 'Continue Free'
                      : `Select ${tier.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-600 hover:text-slate-900 font-semibold underline"
          >
            Skip for now, go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
