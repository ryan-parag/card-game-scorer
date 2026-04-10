import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center">
        <Loader className="w-6 h-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};
