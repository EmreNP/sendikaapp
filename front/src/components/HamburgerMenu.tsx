import { useState } from "react";
import { Menu, X, Bell, UserPlus, Info, Phone, Mail, MapPin, ChevronRight, Facebook, Twitter, Instagram, Youtube, Linkedin, LogOut, Briefcase } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { useAuth } from "../context/AuthContext";

interface HamburgerMenuProps {
  onLogout?: () => void;
  onDistrictRepClick?: () => void;
}

export function HamburgerMenu({ onLogout, onDistrictRepClick }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const { role } = useAuth();

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#", color: "hover:bg-[#1877F2]" },
    { icon: Twitter, label: "Twitter", href: "#", color: "hover:bg-[#1DA1F2]" },
    { icon: Instagram, label: "Instagram", href: "#", color: "hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#FCAF45]" },
    { icon: Youtube, label: "YouTube", href: "#", color: "hover:bg-[#FF0000]" },
    { icon: Linkedin, label: "LinkedIn", href: "#", color: "hover:bg-[#0A66C2]" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="relative group p-3 sm:p-3.5 bg-gradient-to-br from-slate-800 via-slate-900 to-black hover:from-slate-900 hover:via-black hover:to-slate-950 rounded-2xl transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.35)] active:scale-95 overflow-hidden"
          aria-label="Menu"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="absolute inset-0 bg-blue-600/5"></div>
          <Menu className="w-6 h-6 sm:w-6 sm:h-6 text-white relative z-10" strokeWidth={2} />
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="bg-white border-l border-slate-200/80 p-0 w-[75vw] max-w-none sm:w-[500px] [&>button]:hidden flex flex-col h-full overflow-hidden">
        <SheetTitle className="sr-only">Menü</SheetTitle>
        <SheetDescription className="sr-only">
          Türk Diyanet Vakıf-sen KONYA navigasyon menüsü
        </SheetDescription>
        
        {/* Main Flex Container - Full Height, No Scroll */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 px-[5%] py-[3vh]">
          {/* Items Container with Justify Between to spread items vertically */}
          <div className="flex-1 flex flex-col justify-between gap-3">
            
            {/* Top Group: Notifications + About */}
            <div className="flex flex-col gap-3 flex-[2]">
              {/* Notification Cards Row */}
              <div className="grid grid-cols-2 gap-[3%] flex-1 min-h-0">
                {/* Member Registration or District Rep */}
                {role === 'workplace_rep' ? (
                  <button 
                    onClick={() => {
                      if (onDistrictRepClick) {
                        onDistrictRepClick();
                        setOpen(false);
                      }
                    }}
                    className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative h-full p-[7%] flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                          <Briefcase className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" strokeWidth={2.5} />
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-400 to-purple-500 text-white border-0 shadow-lg px-2 py-0.5 text-[0.6rem]">
                          Özel
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-white leading-tight mb-1 text-left" style={{ fontWeight: 700, fontSize: "clamp(0.85rem,1.8vw,1.1rem)", letterSpacing: "-0.01em" }}>
                          İlçe İşyeri Temsilcisi
                        </h3>
                        <div className="flex items-center text-purple-100 gap-1" style={{ fontSize: "clamp(0.65rem,1.4vw,0.75rem)", fontWeight: 500 }}>
                          <span>Görüntüle</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative h-full p-[7%] flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-lg">
                          <UserPlus className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" strokeWidth={2.5} />
                        </div>
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg px-2 py-0.5 text-[0.6rem]">
                          Yeni
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-white leading-tight mb-1 text-left" style={{ fontWeight: 700, fontSize: "clamp(0.85rem,1.8vw,1.1rem)", letterSpacing: "-0.01em" }}>
                          Üye Kayıt
                        </h3>
                        <div className="flex items-center text-blue-100 gap-1" style={{ fontSize: "clamp(0.65rem,1.4vw,0.75rem)", fontWeight: 500 }}>
                          <span>Görüntüle</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Notifications */}
                <button className="relative bg-white border-2 border-slate-200 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative h-full p-[7%] flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-md">
                        <Bell className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)] text-slate-700" strokeWidth={2.5} />
                      </div>
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg px-2 py-0.5 text-[0.6rem]">
                        5
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-slate-800 leading-tight mb-1 text-left" style={{ fontWeight: 700, fontSize: "clamp(0.85rem,1.8vw,1.1rem)", letterSpacing: "-0.01em" }}>
                        Bildirimler
                      </h3>
                      <p className="text-slate-600 leading-snug mb-1 text-left" style={{ fontWeight: 500, fontSize: "clamp(0.65rem,1.4vw,0.75rem)" }}>
                        5 yeni
                      </p>
                      <div className="flex items-center text-slate-500 gap-1" style={{ fontSize: "clamp(0.65rem,1.4vw,0.75rem)", fontWeight: 500 }}>
                        <span>Görüntüle</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* About Button */}
              <button className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-blue-200 w-full flex-shrink-0 flex-[0.8] min-h-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative h-full px-[5%] flex items-center gap-[4%]">
                  <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg flex-shrink-0">
                    <Info className="w-[clamp(1.1rem,2.2vw,1.4rem)] h-[clamp(1.1rem,2.2vw,1.4rem)] text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0 text-left py-2">
                    <h3 className="text-slate-800 leading-tight mb-0.5" style={{ fontWeight: 700, fontSize: "clamp(1rem,2vw,1.1rem)", letterSpacing: "-0.01em" }}>
                      Hakkımızda
                    </h3>
                    <p className="text-slate-600 leading-snug truncate" style={{ fontWeight: 500, fontSize: "clamp(0.75rem,1.5vw,0.85rem)" }}>
                      Kurumumuz ve değerlerimiz
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            </div>

            {/* Contact Section - Middle Priority */}
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-[4%] shadow-md flex-[2.5] min-h-0 overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 mb-[2%] flex-shrink-0">
                <h3 className="text-slate-800 uppercase tracking-wider" style={{ fontWeight: 700, fontSize: "clamp(0.75rem,1.5vw,0.85rem)", letterSpacing: "0.08em" }}>
                  İletişim
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-600 via-blue-400 to-transparent"></div>
              </div>
              
              <div className="flex-1 flex flex-col justify-around min-h-0">
                <a href="tel:+903322211234" className="flex items-center gap-[4%] p-[2%] hover:bg-white rounded-xl transition-all group">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg flex-shrink-0">
                    <Phone className="w-[clamp(1rem,2vw,1.2rem)] h-[clamp(1rem,2vw,1.2rem)] text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-500 text-[0.65rem] font-medium leading-tight">Telefon</div>
                    <div className="text-slate-800 font-bold text-sm truncate">+90 (332) 221 12 34</div>
                  </div>
                </a>

                <a href="mailto:info@tdvakifsen-konya.org.tr" className="flex items-center gap-[4%] p-[2%] hover:bg-white rounded-xl transition-all group">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg flex-shrink-0">
                    <Mail className="w-[clamp(1rem,2vw,1.2rem)] h-[clamp(1rem,2vw,1.2rem)] text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-500 text-[0.65rem] font-medium leading-tight">E-posta</div>
                    <div className="text-slate-800 font-bold text-sm truncate">info@tdvakifsen-konya.org.tr</div>
                  </div>
                </a>

                <div className="flex items-center gap-[4%] p-[2%] hover:bg-white rounded-xl transition-all group">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg flex-shrink-0">
                    <MapPin className="w-[clamp(1rem,2vw,1.2rem)] h-[clamp(1rem,2vw,1.2rem)] text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-500 text-[0.65rem] font-medium leading-tight">Adres</div>
                    <div className="text-slate-800 font-bold text-sm truncate">Konya, Türkiye</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media - Lower Priority */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-xl overflow-hidden flex-[1] min-h-0 flex flex-col justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent"></div>
              <div className="relative h-full px-[5%] py-[3%] flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                  <h3 className="uppercase tracking-wider text-xs font-bold" style={{ letterSpacing: "0.08em" }}>
                    Sosyal Medya
                  </h3>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
                
                <div className="flex-1 flex items-center">
                  <div className="w-full grid grid-cols-5 gap-[3%]">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        className={`aspect-square flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-lg transition-all duration-300 hover:scale-110 shadow-lg ${social.color}`}
                        aria-label={social.label}
                      >
                        <social.icon className="w-[50%] h-[50%]" strokeWidth={2} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Group: Logout + Footer */}
            <div className="flex flex-col gap-3 flex-shrink-0 mt-auto">
              {/* Logout Button */}
              {onLogout && (
                <button 
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="w-full relative bg-red-50 border border-red-100 rounded-2xl p-3 overflow-hidden group hover:bg-red-100/80 transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-red-700 font-semibold text-sm">Çıkış Yap</span>
                  </div>
                </button>
              )}

              {/* Footer */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200">
                  <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                  <p className="text-slate-500 text-[0.65rem] font-medium">
                    © 2024 TDVS KONYA
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
