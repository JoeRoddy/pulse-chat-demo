import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const AnyComponent = Component as any;
  return <AnyComponent {...pageProps} />;
}
