import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import image1 from "figma:asset/0e101077456e36658b08ddc5e7f2a8af114b2ce8.png";
import image2 from "figma:asset/cce6cbff38efe3915efdc5591a934a82f0ed0652.png";
import image3 from "figma:asset/cbacfa0c287a10ca06066acc91a4e94e1afe914a.png";

const slides = [
  {
    id: 1,
    title: "Sendika Etkinliklerimiz",
    description: "Üyelerimiz için düzenlenen toplantılar ve seminerler",
    image: image1,
  },
  {
    id: 2,
    title: "Yönetim Kurulu",
    description: "Sendikamızın önderliğinde güçlü birliktelik",
    image: image2,
  },
  {
    id: 3,
    title: "Hak ve Adalet Mücadelemiz",
    description: "Din görevlilerinin haklarını savunuyoruz",
    image: image3,
  },
];

export function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-2 max-w-7xl mx-auto">
      <div className="relative w-full h-[24vh] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-xl shadow-blue-900/20 border-2 border-white/60">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
              <div className="max-w-3xl">
                <h3 className="mb-1.5 drop-shadow-lg">{slide.title}</h3>
                <p className="text-sm text-gray-100 drop-shadow-md">{slide.description}</p>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={prevSlide}
          className="absolute left-0 top-0 bottom-0 w-1/4 opacity-0 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 text-blue-700" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-0 top-0 bottom-0 w-1/4 opacity-0 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 text-blue-700" />
        </button>
      </div>

    </div>
  );
}
