import { Outlet, Link } from "react-router-dom";
import { VendorProvider } from "../context/VendorContext";
import logoImg from "../../assets/logo.png";

const VendorOnboardingLayout = () => {
  return (
    <VendorProvider>
      <div className="wedding-module min-h-screen bg-background">
        {/* Top bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/wedding" className="flex items-center gap-2">
                <div className="h-10 w-10 md:h-12 md:w-12 overflow-hidden flex-shrink-0">
                  <img src={logoImg} alt="Logo" className="h-full w-full object-cover" />
                </div>
              </Link>
              <span
                className="text-sm md:text-base font-bold text-primary uppercase tracking-wider"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Vendor Portal
              </span>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="pt-16">
          <Outlet />
        </main>
      </div>
    </VendorProvider>
  );
};

export default VendorOnboardingLayout;
