import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const { loadFromStorage } = useAuth();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            border: '1px solid #fde8d0',
          },
        }}
      />
    </>
  );
}
