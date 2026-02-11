export function IslamicPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="persian-floral"
          x="0"
          y="0"
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          {/* Central flower motif inspired by Persian tiles */}
          <g transform="translate(100, 100)">
            {/* Main flower center */}
            <circle cx="0" cy="0" r="8" fill="currentColor" opacity="0.3" />
            <circle cx="0" cy="0" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            
            {/* Petals arranged in circular pattern */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * 15;
              const y = Math.sin(rad) * 15;
              return (
                <g key={i} transform={`rotate(${angle})`}>
                  <ellipse cx="15" cy="0" rx="8" ry="5" fill="currentColor" opacity="0.2" />
                  <path
                    d="M 10 -2 Q 15 0 10 2 Q 8 0 10 -2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </g>
              );
            })}
            
            {/* Arabesque flowing curves */}
            <path
              d="M 25 0 Q 35 -10 45 -5 Q 50 0 45 5 Q 35 10 25 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <path
              d="M -25 0 Q -35 -10 -45 -5 Q -50 0 -45 5 Q -35 10 -25 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            
            {/* Decorative leaves */}
            <path
              d="M 30 -8 Q 35 -12 38 -10 Q 36 -8 35 -5 Q 33 -6 30 -8"
              fill="currentColor"
              opacity="0.2"
            />
            <path
              d="M 30 8 Q 35 12 38 10 Q 36 8 35 5 Q 33 6 30 8"
              fill="currentColor"
              opacity="0.2"
            />
          </g>
          
          {/* Corner spiral motifs */}
          <path
            d="M 5 5 Q 10 5 15 10 Q 15 15 10 20 Q 5 20 5 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.2"
          />
          <path
            d="M 195 195 Q 190 195 185 190 Q 185 185 190 180 Q 195 180 195 185"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.2"
          />
          
          {/* Connecting vine pattern */}
          <path
            d="M 0 100 Q 20 90 40 100 Q 60 110 80 100 Q 100 90 120 100 Q 140 110 160 100 Q 180 90 200 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.15"
          />
          <path
            d="M 100 0 Q 90 20 100 40 Q 110 60 100 80 Q 90 100 100 120 Q 110 140 100 160 Q 90 180 100 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.15"
          />
          
          {/* Small decorative dots */}
          <circle cx="50" cy="50" r="1.5" fill="currentColor" opacity="0.25" />
          <circle cx="150" cy="150" r="1.5" fill="currentColor" opacity="0.25" />
          <circle cx="50" cy="150" r="1.5" fill="currentColor" opacity="0.25" />
          <circle cx="150" cy="50" r="1.5" fill="currentColor" opacity="0.25" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#persian-floral)" />
    </svg>
  );
}

export function IslamicCornerDecoration({ position = "top-left" }: { position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0 rotate-90",
    "bottom-left": "bottom-0 left-0 -rotate-90",
    "bottom-right": "bottom-0 right-0 rotate-180",
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-32 h-32 opacity-[0.08] pointer-events-none`}>
      <svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Persian corner arabesque with flowing florals */}
        
        {/* Main flowing curve */}
        <path
          d="M 0 0 Q 20 0 35 15 Q 50 30 50 50 Q 50 70 65 85 Q 80 100 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-blue-600"
        />
        
        {/* Parallel decorative curve */}
        <path
          d="M 0 5 Q 18 5 30 18 Q 42 30 42 48 Q 42 66 54 78 Q 66 90 85 95"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-blue-500"
          opacity="0.6"
        />
        
        {/* Floral elements along the curve */}
        <g transform="translate(25, 25)">
          <circle cx="0" cy="0" r="5" fill="currentColor" className="text-blue-600" opacity="0.4" />
          <circle cx="0" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-700" />
          {/* Petals */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <ellipse
              key={i}
              cx="0"
              cy="0"
              rx="4"
              ry="2"
              transform={`rotate(${angle})`}
              fill="currentColor"
              className="text-blue-500"
              opacity="0.3"
            />
          ))}
        </g>
        
        <g transform="translate(55, 55)">
          <circle cx="0" cy="0" r="6" fill="currentColor" className="text-blue-600" opacity="0.35" />
          {/* Leaf motifs */}
          <path
            d="M 0 -8 Q 4 -10 6 -8 Q 4 -6 2 -4 Q 1 -5 0 -8"
            fill="currentColor"
            className="text-blue-600"
            opacity="0.4"
          />
          <path
            d="M 8 0 Q 10 4 8 6 Q 6 4 4 2 Q 5 1 8 0"
            fill="currentColor"
            className="text-blue-600"
            opacity="0.4"
          />
        </g>
        
        {/* Decorative spirals */}
        <path
          d="M 10 10 Q 12 8 15 10 Q 15 13 13 15 Q 10 15 10 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          className="text-blue-500"
        />
        
        <path
          d="M 75 75 Q 78 73 80 75 Q 80 78 78 80 Q 75 80 75 77"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          className="text-blue-500"
        />
        
        {/* Small connecting vines */}
        <path
          d="M 35 10 Q 40 12 42 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          className="text-blue-400"
          opacity="0.5"
        />
        <path
          d="M 10 35 Q 12 40 18 42"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          className="text-blue-400"
          opacity="0.5"
        />
        
        {/* Ornamental dots */}
        <circle cx="15" cy="15" r="1.5" fill="currentColor" className="text-blue-600" opacity="0.5" />
        <circle cx="45" cy="25" r="1" fill="currentColor" className="text-blue-500" opacity="0.4" />
        <circle cx="25" cy="45" r="1" fill="currentColor" className="text-blue-500" opacity="0.4" />
        <circle cx="70" cy="60" r="1.5" fill="currentColor" className="text-blue-600" opacity="0.5" />
      </svg>
    </div>
  );
}

export function IslamicTileBorder() {
  return (
    <svg
      className="w-full h-3"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      viewBox="0 0 600 30"
    >
      <defs>
        <pattern
          id="tile-border"
          x="0"
          y="0"
          width="60"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          {/* Central floral motif */}
          <circle cx="30" cy="15" r="4" fill="currentColor" className="text-blue-600" opacity="0.2" />
          <circle cx="30" cy="15" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-700" opacity="0.25" />
          
          {/* Petals around center */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 30 + Math.cos(rad) * 6;
            const y = 15 + Math.sin(rad) * 6;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="2.5"
                ry="1.5"
                transform={`rotate(${angle} ${x} ${y})`}
                fill="currentColor"
                className="text-blue-500"
                opacity="0.15"
              />
            );
          })}
          
          {/* Connecting arabesque curves */}
          <path
            d="M 0 15 Q 8 10 15 15 Q 22 20 30 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-blue-600"
            opacity="0.2"
          />
          <path
            d="M 30 15 Q 38 10 45 15 Q 52 20 60 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-blue-600"
            opacity="0.2"
          />
          
          {/* Small decorative leaves */}
          <path
            d="M 12 12 Q 14 10 16 12 Q 15 13 14 14"
            fill="currentColor"
            className="text-blue-500"
            opacity="0.15"
          />
          <path
            d="M 44 12 Q 46 10 48 12 Q 47 13 46 14"
            fill="currentColor"
            className="text-blue-500"
            opacity="0.15"
          />
          
          {/* Ornamental dots */}
          <circle cx="10" cy="15" r="1" fill="currentColor" className="text-blue-600" opacity="0.2" />
          <circle cx="50" cy="15" r="1" fill="currentColor" className="text-blue-600" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tile-border)" />
    </svg>
  );
}

export function MosqueArchPattern() {
  return (
    <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden opacity-[0.06] pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 140"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Repeating arch pattern with Persian details */}
        {[...Array(7)].map((_, i) => (
          <g key={i} transform={`translate(${i * 180}, 0)`}>
            {/* Main arch */}
            <path
              d="M10 140 L10 45 Q10 15 40 12 L60 12 Q90 15 90 45 L90 140"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-600"
            />
            {/* Inner arch detail */}
            <path
              d="M20 140 L20 48 Q20 22 40 20 L60 20 Q80 22 80 48 L80 140"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-blue-500"
              opacity="0.6"
            />
            
            {/* Decorative top with floral motif */}
            <g transform="translate(50, 20)">
              <circle cx="0" cy="0" r="4" fill="currentColor" className="text-blue-600" opacity="0.4" />
              {/* Small petals */}
              {[0, 90, 180, 270].map((angle, idx) => (
                <ellipse
                  key={idx}
                  cx="0"
                  cy="0"
                  rx="3"
                  ry="1.5"
                  transform={`rotate(${angle})`}
                  fill="currentColor"
                  className="text-blue-500"
                  opacity="0.3"
                />
              ))}
            </g>
            
            {/* Top pointed decoration */}
            <path
              d="M45 12 L50 3 L55 12"
              fill="currentColor"
              className="text-blue-600"
              opacity="0.3"
            />
            
            {/* Side arabesque flourishes */}
            <path
              d="M 15 60 Q 8 55 8 48 Q 8 45 10 43"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-blue-500"
              opacity="0.4"
            />
            <path
              d="M 85 60 Q 92 55 92 48 Q 92 45 90 43"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-blue-500"
              opacity="0.4"
            />
            
            {/* Inner decorative elements */}
            <path
              d="M 30 50 Q 35 48 40 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-blue-400"
              opacity="0.3"
            />
            <path
              d="M 60 50 Q 65 48 70 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
              className="text-blue-400"
              opacity="0.3"
            />
            
            {/* Small ornamental circles */}
            <circle cx="30" cy="60" r="1.5" fill="currentColor" className="text-blue-500" opacity="0.3" />
            <circle cx="50" cy="55" r="1" fill="currentColor" className="text-blue-600" opacity="0.4" />
            <circle cx="70" cy="60" r="1.5" fill="currentColor" className="text-blue-500" opacity="0.3" />
          </g>
        ))}
        
        {/* Connecting vine pattern at bottom */}
        <path
          d="M 0 120 Q 60 115 120 120 Q 180 125 240 120 Q 300 115 360 120 Q 420 125 480 120 Q 540 115 600 120 Q 660 125 720 120 Q 780 115 840 120 Q 900 125 960 120 Q 1020 115 1080 120 Q 1140 125 1200 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-blue-600"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}
