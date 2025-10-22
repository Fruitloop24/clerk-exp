import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

interface UsageData {
  userId: string;
  plan: string;
  usageCount: number;
  limit: number | string;
  remaining: number | string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  usage?: {
    count: number;
    limit: number | string;
    plan: string;
  };
  error?: string;
  message?: string;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  const fetchUsage = async () => {
    try {
      const token = await getToken({ template: 'pan-api' });
      const response = await fetch(`${API_URL}/api/usage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const makeRequest = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = await getToken({ template: 'pan-api' });
      const response = await fetch(`${API_URL}/api/data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data: ApiResponse = await response.json();

      if (response.ok) {
        setMessage(`✓ Success! ${data.data?.message}`);
        await fetchUsage();
      } else {
        setMessage(`✗ ${data.error || 'Request failed'} ${data.message || ''}`);
      }
    } catch (error) {
      setMessage('✗ Failed to make request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (targetTier: string) => {
    try {
      const token = await getToken({ template: 'pan-api' });
      const response = await fetch(`${API_URL}/api/create-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process');
    }
  };

  const handleManageBilling = async () => {
    try {
      const token = await getToken({ template: 'pan-api' });
      const response = await fetch(`${API_URL}/api/customer-portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe customer portal
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Failed to open billing portal');
    }
  };

  useEffect(() => {
    const success = searchParams.get('success');

    if (success === 'true') {
      setMessage('🎉 Upgrade successful! Refreshing your account...');
      // Wait for user to be loaded, then reload to get fresh JWT with new plan
      const timer = setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      return () => clearTimeout(timer);
    } else if (isLoaded && user) {
      fetchUsage();
    }
  }, [isLoaded, user, searchParams]);

  const plan = (user?.publicMetadata?.plan as string) || 'free';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="no-underline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-2xl font-bold">
          CloudDocs Pro
        </Link>
        <div className="flex gap-4 items-center">
          {plan === 'free' ? (
            <button
              onClick={() => handleUpgrade('pro')}
              className="px-6 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-[15px]"
            >
              ⚡ Upgrade to Pro
            </button>
          ) : plan === 'enterprise' ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleUpgrade('pro')}
                className="px-4 py-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm"
              >
                Upgrade to Pro
              </button>
              <button
                onClick={handleManageBilling}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg cursor-pointer font-semibold text-sm transition-all"
              >
                Manage Billing
              </button>
            </div>
          ) : plan === 'pro' ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleUpgrade('developer')}
                className="px-4 py-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm"
              >
                Upgrade to Developer
              </button>
              <button
                onClick={handleManageBilling}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg cursor-pointer font-semibold text-sm transition-all"
              >
                Manage Billing
              </button>
            </div>
          ) : (
            <button
              onClick={handleManageBilling}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg cursor-pointer font-semibold text-[15px] transition-all"
            >
              Manage Billing
            </button>
          )}
          <UserButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl mb-2 text-slate-900 font-extrabold">
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            Process documents and track your usage
          </p>
        </div>

        {/* Usage Counter - Tier Specific */}
        {usage && (
          <>
            {/* Free Tier Display */}
            {plan === 'free' && (
              <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/30">
                <div className="text-8xl font-black mb-2 leading-none">
                  {usage.usageCount} / {usage.limit}
                </div>
                <p className="text-2xl opacity-95 mb-2 font-semibold">
                  Documents Processed
                </p>
                <p className="text-lg opacity-90">
                  {usage.remaining} remaining this month
                </p>
              </div>
            )}

            {/* Pro Tier Display */}
            {plan === 'pro' && (
              <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-purple-500 to-purple-600 shadow-2xl shadow-purple-500/30">
                <div className="text-8xl font-black mb-2 leading-none">
                  {usage.usageCount}
                </div>
                <p className="text-2xl opacity-95 mb-2 font-semibold">
                  Documents Processed
                </p>
                <p className="text-lg opacity-90">
                  ✨ Unlimited • Pro Plan Active
                </p>
              </div>
            )}

            {/* Enterprise Tier Display */}
            {plan === 'enterprise' && (
              <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-500/30">
                <div className="text-8xl font-black mb-2 leading-none">
                  {usage.usageCount} / {usage.limit}
                </div>
                <p className="text-2xl opacity-95 mb-2 font-semibold">
                  Documents Processed
                </p>
                <p className="text-lg opacity-90">
                  {usage.remaining} remaining • Enterprise Plan
                </p>
              </div>
            )}

            {/* Developer Tier Display */}
            {plan === 'developer' && (
              <div className="p-12 rounded-3xl mb-8 text-center text-white bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/30">
                <div className="text-8xl font-black mb-2 leading-none">
                  {usage.usageCount}
                </div>
                <p className="text-2xl opacity-95 mb-2 font-semibold">
                  Documents Processed
                </p>
                <p className="text-lg opacity-90">
                  ✨ Unlimited • Developer Plan Active
                </p>
              </div>
            )}
          </>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 mb-8">
          {/* Account Card */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200">
            <h2 className="text-lg mb-6 text-slate-600 font-semibold uppercase tracking-wider">
              Account
            </h2>
            <p className="mb-4 text-slate-600 text-[0.95rem]">
              <strong className="text-slate-800">Email:</strong><br />
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <div className={`mt-6 inline-block px-5 py-2 rounded-lg text-[0.85rem] font-bold tracking-wider ${
              plan === 'pro'
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {(plan as string).toUpperCase()} PLAN
            </div>
          </div>

          {/* Usage Stats Card */}
          {usage && (
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <h2 className="text-lg mb-6 text-slate-600 font-semibold uppercase tracking-wider">
                Usage This Month
              </h2>
              <div className="mb-6">
                <div className="text-5xl font-extrabold text-slate-900 leading-none">
                  {usage.usageCount}
                  {plan === 'free' && (
                    <span className="text-2xl text-slate-400 font-semibold"> / {usage.limit}</span>
                  )}
                </div>
                <p className="text-slate-600 text-[0.95rem] mt-2">
                  documents processed
                </p>
              </div>
              {plan === 'free' && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="m-0 text-blue-500 font-semibold text-[0.95rem]">
                    {usage.remaining} requests remaining
                  </p>
                </div>
              )}
              {plan === 'pro' && (
                <div className="p-4 bg-emerald-100 rounded-xl border border-emerald-300">
                  <p className="m-0 text-emerald-600 font-semibold text-[0.95rem]">
                    ✨ Unlimited processing
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test API Section */}
        <div className="bg-white p-10 rounded-2xl border border-gray-200 mb-8">
          <h2 className="text-2xl mb-4 text-slate-900 font-bold">
            Test Document Processing
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Click below to simulate processing a document. This counts toward your usage limit.
          </p>

          <button
            onClick={makeRequest}
            disabled={loading}
            className={`px-8 py-4 text-base text-white border-none rounded-xl font-semibold transition-all ${
              loading
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-blue-500 cursor-pointer shadow-lg shadow-blue-500/30'
            }`}
          >
            {loading ? '⏳ Processing...' : '📄 Process Document'}
          </button>

          {message && (
            <div className={`mt-6 px-5 py-4 rounded-xl font-medium ${
              message.includes('✗')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Upgrade CTAs - Tier Specific */}
        {plan === 'free' && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-12 rounded-3xl text-white text-center shadow-2xl shadow-purple-500/30 mb-8">
            <h3 className="text-3xl mb-4 font-bold">
              Upgrade Your Plan
            </h3>
            <p className="text-lg mb-8 opacity-95 leading-relaxed">
              Get more documents and advanced features
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleUpgrade('enterprise')}
                className="px-8 py-3 bg-white text-purple-600 border-none rounded-xl cursor-pointer font-bold shadow-xl transition-all hover:bg-purple-50"
              >
                Enterprise - $35/mo
              </button>
              <button
                onClick={() => handleUpgrade('pro')}
                className="px-8 py-3 bg-white text-purple-600 border-none rounded-xl cursor-pointer font-bold shadow-xl transition-all hover:bg-purple-50"
              >
                Pro - $29/mo
              </button>
              <button
                onClick={() => handleUpgrade('developer')}
                className="px-8 py-3 bg-white text-purple-600 border-none rounded-xl cursor-pointer font-bold shadow-xl transition-all hover:bg-purple-50"
              >
                Developer - $50/mo
              </button>
            </div>
          </div>
        )}

        {plan === 'enterprise' && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-3xl text-white text-center shadow-2xl shadow-purple-500/30 mb-8">
            <div className="text-5xl mb-2">🎯</div>
            <h3 className="text-2xl font-bold mb-2">
              Enterprise Plan Active
            </h3>
            <p className="opacity-95 mb-4">
              10 documents per month
            </p>
            <button
              onClick={() => handleUpgrade('pro')}
              className="px-8 py-3 bg-white text-purple-600 border-none rounded-xl cursor-pointer font-bold shadow-xl transition-all hover:bg-purple-50"
            >
              Upgrade to Pro - Unlimited
            </button>
          </div>
        )}

        {plan === 'pro' && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-3xl text-white text-center shadow-2xl shadow-purple-500/30 mb-8">
            <div className="text-5xl mb-2">✨</div>
            <h3 className="text-2xl font-bold mb-2">
              Pro Plan Active
            </h3>
            <p className="opacity-95">
              You have unlimited document processing
            </p>
          </div>
        )}

        {plan === 'developer' && (
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-3xl text-white text-center shadow-2xl shadow-emerald-500/30 mb-8">
            <div className="text-5xl mb-2">💻</div>
            <h3 className="text-2xl font-bold mb-2">
              Developer Plan Active
            </h3>
            <p className="opacity-95">
              You have unlimited document processing with full API access
            </p>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-slate-500 text-sm">
            Built with the{' '}
            <span className="font-semibold text-slate-700">Production SaaS Starter Template</span>
            {' '}• Full-stack React + Cloudflare Workers + Clerk Auth
          </p>
        </div>
      </div>
    </div>
  );
}
