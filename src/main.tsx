import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './contexts/CartContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </HelmetProvider>
);
