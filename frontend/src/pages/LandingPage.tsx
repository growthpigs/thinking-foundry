import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function LandingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('No session link provided.');
      setLoading(false);
      return;
    }
    // Token is valid if we got here (server returned 200 for /s/:token)
    // Navigate to the session page with the token
    setLoading(false);
    navigate(`/session/${token}`, { replace: true });
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Validating session link...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Link Invalid</h1>
          <p className="text-zinc-400">{error}</p>
          <p className="text-zinc-600 text-sm mt-4">Please request a new link from your session host.</p>
        </div>
      </div>
    );
  }

  return null;
}
