
import React from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BannerSection } from '@/components/sections/BannerSection';
import { TopStrategyFlowSection } from '@/components/sections/TopStrategyFlowSection';
import { DataTableSection } from '@/components/sections/DataTableSection';

const Index: React.FC = () => {
  return (
    <div className="bg-[#0C0E12] min-h-screen">
      <div className="relative z-10 bg-[#0C0E12]">
        <Header />
        
        <main className="w-full pt-6 pb-12 lg:pt-12 lg:pb-24">
          <BannerSection />
          <TopStrategyFlowSection />
          <DataTableSection />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
