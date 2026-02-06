import { Calculator, Newspaper, UserPlus, Building2, Phone, Briefcase } from "lucide-react";
import dibbysLogo from "figma:asset/57a25f6df2604d358b2210b47d73f2d0dbdfc136.png";
import { useAuth } from "../context/AuthContext";

const quickAccessItems = [
  {
    id: 1,
    title: "Üyelik",
    icon: UserPlus,
    color: "bg-gradient-to-br from-blue-600 to-blue-700",
  },
  {
    id: 2,
    title: "DİBBYS",
    icon: "dibbys",
    color: "bg-white",
  },
  {
    id: 3,
    title: "Haberler",
    icon: Newspaper,
    color: "bg-gradient-to-br from-indigo-600 to-indigo-700",
  },
  {
    id: 4,
    title: "Bize Ulaşın",
    icon: Phone,
    color: "bg-gradient-to-br from-cyan-600 to-cyan-700",
  },
  {
    id: 5,
    title: "Muktesep Hesaplama",
    icon: Calculator,
    color: "bg-gradient-to-br from-blue-600 to-blue-700",
  },
  {
    id: 6,
    title: "Anlaşmalı Kurumlar",
    icon: Building2,
    color: "bg-gradient-to-br from-indigo-600 to-indigo-700",
  },
];

interface QuickAccessGridProps {
  onMembershipClick?: () => void;
  onNewsClick?: () => void;
  onContactClick?: () => void;
  onPartnerInstitutionsClick?: () => void;
  onMuktesepClick?: () => void;
}

export function QuickAccessGrid({ 
  onMembershipClick, 
  onNewsClick, 
  onContactClick, 
  onPartnerInstitutionsClick, 
  onMuktesepClick
}: QuickAccessGridProps) {
  const { role } = useAuth();

  const handleClick = (itemId: number) => {
    if (itemId === 1 && onMembershipClick) {
      onMembershipClick();
    }
    if (itemId === 3 && onNewsClick) {
      onNewsClick();
    }
    if (itemId === 4 && onContactClick) {
      onContactClick();
    }
    if (itemId === 5 && onMuktesepClick) {
      onMuktesepClick();
    }
    if (itemId === 6 && onPartnerInstitutionsClick) {
      onPartnerInstitutionsClick();
    }
    // Handle other button clicks here
  };

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-3 max-w-7xl mx-auto">
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {quickAccessItems.map((item) => {
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="relative flex flex-col items-center gap-2.5 p-3.5 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-900/15 transition-all hover:-translate-y-1 border border-white/80 group"
            >
              <div className={`${item.color} w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shadow-black/20 relative group-hover:scale-105 transition-all duration-300 overflow-hidden`}>
                {item.icon === "dibbys" ? (
                  <img 
                    src={dibbysLogo} 
                    alt="DİBBYS Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  (() => {
                    const Icon = item.icon as any;
                    return (
                      <>
                        <Icon className="w-7 h-7 text-white relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                      </>
                    );
                  })()
                )}
              </div>
              <span className="text-xs text-gray-700 text-center leading-tight">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
