import { ImageWithFallback } from "./figma/ImageWithFallback";

export function IslamicTileBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Primary tile pattern - top right */}
      <div className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-[0.04] rotate-12">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1531162805941-58330188d75c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc2xhbWljJTIwdGlsZSUyMHBhdHRlcm58ZW58MXx8fHwxNzYzMTc4ODk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt=""
          className="w-full h-full object-cover rounded-full blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-blue-800/30 mix-blend-multiply rounded-full"></div>
      </div>

      {/* Persian tile art - left side */}
      <div className="absolute top-[30%] -left-32 w-[500px] h-[500px] opacity-[0.03] -rotate-12">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1744752638965-3ec9127e75bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzaWFuJTIwdGlsZSUyMGFydHxlbnwxfHx8fDE3NjMxNzg4OTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt=""
          className="w-full h-full object-cover rounded-3xl blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-700/30 to-blue-500/20 mix-blend-multiply rounded-3xl"></div>
      </div>

      {/* Arabic calligraphy - center right */}
      <div className="absolute top-[50%] right-0 w-[450px] h-[450px] opacity-[0.035] rotate-6">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1761475457984-1a4f6c272368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmFiaWMlMjBjYWxsaWdyYXBoeSUyMHBhdHRlcm58ZW58MXx8fHwxNzYzMTc4ODk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt=""
          className="w-full h-full object-cover blur-[3px]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-blue-600/40 to-transparent mix-blend-multiply"></div>
      </div>

      {/* Mosque tile detail - bottom */}
      <div className="absolute bottom-0 left-[20%] w-[550px] h-[550px] opacity-[0.025] -rotate-3">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1711843653600-57bc6bcd2229?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3NxdWUlMjB0aWxlJTIwZGV0YWlsfGVufDF8fHx8MTc2MzE3ODg5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt=""
          className="w-full h-full object-cover rounded-full blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-800/30 to-blue-600/20 mix-blend-multiply rounded-full"></div>
      </div>

      {/* Subtle overlay for cohesion */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-blue-50/20 to-white/80"></div>
    </div>
  );
}


