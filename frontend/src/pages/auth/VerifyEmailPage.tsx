import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, isLoading, error, user, isAuthenticated } = useAuth();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setIsVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setIsSuccess(true);
        setIsVerifying(false);
      } catch (error) {
        setIsVerifying(false);
      }
    };

    verify();
  }, [searchParams, verifyEmail]);

  // Redirect to dashboard if already verified
  useEffect(() => {
    if (isAuthenticated && user?.isVerified && isSuccess) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isSuccess, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying your email...</h2>
          <p className="mt-2 text-gray-600">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verified!
          </h2>
          <p className="mt-4 text-gray-600">
            Your email has been successfully verified. You'll be redirected to the dashboard shortly.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Verification Failed
        </h2>
        <p className="mt-4 text-gray-600">
          {error || 'The verification link is invalid or has expired.'}
        </p>
        <div className="mt-8 space-y-3">
          <Link
            to="/auth/login"
            className="block w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
          >
            Go to Login
          </Link>
          <Link
            to="/auth/forgot-password"
            className="block w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Resend Verification Email
          </Link>
        </div>
      </div>
    </div>
  );
}
