/**
 * Centralized Theme Configuration for the Admin Panel
 * Based on the core "Wedding" design system.
 */

export const ADMIN_THEME = {
  colors: {
    primary: "hsl(var(--primary))", // Dynamic primary from CSS variables
    primaryForeground: "hsl(0 0% 100%)",
    secondary: "hsl(353 30% 94%)", // Soft Pink
    secondaryForeground: "hsl(353 45% 25%)",
    background: "#FFF5F7", 
    card: "#FFFFFF", 
    border: "hsl(353 20% 88%)",
    accent: "hsl(353 45% 45%)",
    muted: "hsl(353 15% 45%)"
  },
  glassmorphism: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropBlur: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px 0 rgba(129, 49, 58, 0.1)"
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Inter', sans-serif"
  },
  animations: {
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  }
};

export const adminStyles = {
  glassCard: "bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300",
  primaryButton: "bg-primary text-white hover:opacity-90 transition-all",
  button: "inline-flex items-center gap-2 bg-[hsl(353,45%,35%)] text-white font-semibold rounded-xl hover:bg-[hsl(353,45%,28%)] transition-all duration-200 shadow-sm hover:shadow-md active:scale-95",
  input: "w-full px-4 py-2.5 rounded-xl border border-[hsl(353,45%,35%)]/20 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(353,45%,35%)]/30 focus:border-[hsl(353,45%,35%)]/50 transition-all",
  heading: "font-serif text-primary",
  sidebarItem: "flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-primary/10 text-foreground",
  sidebarItemActive: "bg-primary text-white shadow-md active-sidebar-item"
};
