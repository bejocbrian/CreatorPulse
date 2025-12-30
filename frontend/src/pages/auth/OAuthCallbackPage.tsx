import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCurrentUser, setLoading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        
        // The access token is in the URL query parameter
        // The refresh token is already set as an httpOnly cookie by the backend
        const token = searchParams.get('token');
        
        if (token) {
          // Store the access token in localStorage
          localStorage.setItem('accessToken', token);
          
          // Fetch current user data
          await getCurrentUser();
          
          // Redirect to dashboard
          navigate('/', { replace: true });
        } else {
          // No token found, redirect to login with error
          const error = searchParams.get('error') || 'oauth_failed';
          navigate('/auth/login', { 
            replace: true,
            state: { error } 
          });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/auth/login', { 
          replace: true,
          state: { error: 'Authentication failed' } 
        });
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, getCurrentUser, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">Completing authentication...</h2>
        <p className="mt-2 text-gray-600">Please wait while we sign you in.</p>
      </div>
    </div>
  );
}
