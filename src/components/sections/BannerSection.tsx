
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BannerSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["active-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-slide effect for multiple banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isLoading) {
    return (
      <section className="w-full mb-8 lg:mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full h-48 bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    // Fallback to original banner if no banners are configured
    return (
      <section className="w-full mb-8 lg:mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <img 
            alt="Defistrats - Discover DeFi Opportunities within the HyperEVM Ecosystems" 
            className="w-full h-auto rounded-lg" 
            src="/assets/2dba768a-aadd-41fc-a80a-6c680fd6988f.png" 
          />
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];

  return (
    <section className="w-full mb-8 lg:mb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Banner */}
          <div className="relative overflow-hidden rounded-lg">
            {currentBanner.link_url ? (
              <a
                href={currentBanner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <img 
                  alt={currentBanner.title}
                  className="w-full h-auto rounded-lg hover:opacity-90 transition-opacity" 
                  src={currentBanner.image_url}
                />
              </a>
            ) : (
              <img 
                alt={currentBanner.title}
                className="w-full h-auto rounded-lg" 
                src={currentBanner.image_url}
              />
            )}
          </div>

          {/* Navigation arrows - only show if there are multiple banners */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                aria-label="Next banner"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots indicator - only show if there are multiple banners */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Description */}
          {currentBanner.description && (
            <p className="text-sm text-gray-400 mt-2 text-center">
              {currentBanner.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
