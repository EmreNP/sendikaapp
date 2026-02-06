// Large circular Persian tile motif for decorative placement
export function CircularPersianMotif() {
  return (
    <svg
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Outer decorative border with spirals */}
      <circle
        cx="150"
        cy="150"
        r="140"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-blue-600"
        opacity="0.3"
      />
      <circle
        cx="150"
        cy="150"
        r="135"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        className="text-blue-500"
        opacity="0.2"
      />
      
      {/* Spiral decorations around border */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 150 + Math.cos(rad) * 137;
        const y = 150 + Math.sin(rad) * 137;
        return (
          <g key={i} transform={`translate(${x}, ${y}) rotate(${angle})`}>
            {/* Spiral curl */}
            <path
              d="M 0 0 Q 3 -2 5 0 Q 5 3 3 5 Q 0 5 -2 3 Q -2 0 0 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-blue-600"
              opacity="0.3"
            />
            {/* Small decorative circles */}
            <circle cx="0" cy="0" r="1" fill="currentColor" className="text-blue-600" opacity="0.3" />
          </g>
        );
      })}
      
      {/* Inner decorative ring */}
      <circle
        cx="150"
        cy="150"
        r="100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-blue-600"
        opacity="0.25"
      />
      
      {/* Central floral composition */}
      <g transform="translate(150, 150)">
        {/* Main center flower */}
        <circle cx="0" cy="0" r="15" fill="currentColor" className="text-blue-600" opacity="0.2" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-700" opacity="0.3" />
        <circle cx="0" cy="0" r="6" fill="currentColor" className="text-blue-700" opacity="0.25" />
        
        {/* Petals in layers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            <ellipse
              cx="20"
              cy="0"
              rx="12"
              ry="6"
              fill="currentColor"
              className="text-blue-500"
              opacity="0.15"
            />
            <ellipse
              cx="20"
              cy="0"
              rx="8"
              ry="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-blue-600"
              opacity="0.2"
            />
          </g>
        ))}
        
        {/* Flowing arabesque branches */}
        {[0, 90, 180, 270].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            {/* Main curved stem */}
            <path
              d="M 0 0 Q 30 -15 60 -10 Q 80 -5 85 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-blue-600"
              opacity="0.2"
            />
            
            {/* Side branches with leaves */}
            <path
              d="M 30 -10 Q 35 -18 38 -20 Q 40 -18 38 -15"
              fill="currentColor"
              className="text-blue-500"
              opacity="0.15"
            />
            <path
              d="M 50 -8 Q 52 -15 55 -16 Q 57 -14 55 -12"
              fill="currentColor"
              className="text-blue-500"
              opacity="0.15"
            />
            
            {/* Carnation-like flowers along branch */}
            <g transform="translate(45, -8)">
              <circle cx="0" cy="0" r="5" fill="currentColor" className="text-blue-600" opacity="0.2" />
              {/* Scalloped edge */}
              {[0, 60, 120, 180, 240, 300].map((a, idx) => {
                const r = (a * Math.PI) / 180;
                return (
                  <circle
                    key={idx}
                    cx={Math.cos(r) * 4}
                    cy={Math.sin(r) * 4}
                    r="2"
                    fill="currentColor"
                    className="text-blue-500"
                    opacity="0.2"
                  />
                );
              })}
            </g>
            
            {/* Terminal flourish */}
            <path
              d="M 75 -2 Q 80 -5 85 -3 Q 88 0 85 3 Q 80 5 75 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-blue-500"
              opacity="0.2"
            />
          </g>
        ))}
        
        {/* Diagonal secondary flowers */}
        {[45, 135, 225, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            <g transform="translate(70, 0)">
              <circle cx="0" cy="0" r="8" fill="currentColor" className="text-blue-600" opacity="0.18" />
              <circle cx="0" cy="0" r="5" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-blue-600" opacity="0.2" />
              {/* Small petals */}
              {[0, 60, 120, 180, 240, 300].map((a, idx) => (
                <ellipse
                  key={idx}
                  cx="0"
                  cy="0"
                  rx="5"
                  ry="2.5"
                  transform={`rotate(${a})`}
                  fill="currentColor"
                  className="text-blue-500"
                  opacity="0.15"
                />
              ))}
            </g>
          </g>
        ))}
      </g>
      
      {/* Decorative dots pattern */}
      {[60, 120].map((radius) => {
        return [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 150 + Math.cos(rad) * radius;
          const y = 150 + Math.sin(rad) * radius;
          return (
            <circle
              key={`${radius}-${i}`}
              cx={x}
              cy={y}
              r="1.5"
              fill="currentColor"
              className="text-blue-500"
              opacity="0.2"
            />
          );
        });
      })}
    </svg>
  );
}

// Small decorative flourish for cards
export function FloralCardAccent() {
  return (
    <svg
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Central small flower */}
      <g transform="translate(40, 40)">
        <circle cx="0" cy="0" r="4" fill="currentColor" opacity="0.25" />
        <circle cx="0" cy="0" r="2" fill="currentColor" opacity="0.3" />
        
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
            opacity="0.2"
          />
        ))}
        
        {/* Flowing curves emanating out */}
        {[0, 90, 180, 270].map((angle, i) => (
          <path
            key={i}
            d="M 0 0 Q 15 -5 25 0"
            transform={`rotate(${angle})`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.2"
          />
        ))}
        
        {/* Leaf accents */}
        <path
          d="M 15 -3 Q 18 -5 20 -3 Q 18 -1 16 0"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M -15 3 Q -18 5 -20 3 Q -18 1 -16 0"
          fill="currentColor"
          opacity="0.18"
        />
      </g>
    </svg>
  );
}
