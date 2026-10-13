import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import { CartAndCheckout } from './pages/CartAndCheckout';
import { Printing } from './pages/Printing';
import { Account } from './pages/Account';
import { Features } from './pages/Features';
import { Wishlist } from './pages/Wishlist';

function AppRouter() {
  const { currentPage } = useNavigation();

  return (
    <div className="wormup-website-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Two-Tier Sticky Header */}
      <Header />

      {/* Main Page Content */}
      <div style={{ flex: 1 }}>
        {currentPage === 'home' && <Home />}
        {currentPage === 'shop' && <Shop />}
        {currentPage === 'product' && <ProductDetails />}
        {(currentPage === 'cart' || currentPage === 'checkout') && <CartAndCheckout />}
        {currentPage === 'printing' && <Printing />}
        {currentPage === 'account' && <Account />}
        {currentPage === 'features' && <Features />}
        {currentPage === 'wishlist' && <Wishlist />}
      </div>

      {/* Slide-in Smart Cart Drawer */}
      <CartDrawer />

      {/* OTP Authentication Modal */}
      <AuthModal />

      {/* Deep Navy Desktop Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <WishlistProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </WishlistProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}
