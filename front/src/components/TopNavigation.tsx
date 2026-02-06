import { ImageWithFallback } from "./figma/ImageWithFallback";
import { HamburgerMenu } from "./HamburgerMenu";
import logo from "figma:asset/35bb759bf7f965cc9346946264a06771442bcc70.png";

interface TopNavigationProps {
  onLogout?: () => void;
  onDistrictRepClick?: () => void;
}

export function TopNavigation({ onLogout, onDistrictRepClick }: TopNavigationProps) {
  return (
    <nav className="relative bg-white border-b-2 border-slate-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.12),0_2px_10px_-2px_rgba(0,0,0,0.08)] z-50">
      <div className="flex items-center justify-between px-5 sm:px-8 lg:px-12 py-4 sm:py-5">
        {/* Logo and Brand Section */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Premium Logo Container */}
          <div className="relative group">
            {/* Elegant glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden bg-white ring-2 ring-slate-100">
              {/* Subtle inner shine */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
              <ImageWithFallback
                src={logo}
                alt="Türk Diyanet Vakıf-sen Logo"
                className="w-full h-full object-cover relative z-10"
              />
            </div>
          </div>
          
          {/* Corporate Brand Typography */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-slate-900 tracking-[-0.02em] leading-none select-none" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              Türk Diyanet Vakıf-sen
            </h1>
            <div className="flex items-center gap-2.5">
              <div className="h-0.5 w-6 bg-gradient-to-r from-blue-600 via-blue-500 to-transparent rounded-full"></div>
              <span className="text-blue-700 text-xs tracking-[0.25em] uppercase select-none" style={{ fontWeight: 500 }}>Konya</span>
            </div>
          </div>
        </div>
        
        {/* Hamburger Menu */}
        <HamburgerMenu onLogout={onLogout} onDistrictRepClick={onDistrictRepClick} />
      </div>
    </nav>
  );
}
