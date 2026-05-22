
import React from 'react';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';

const BTCBridge: React.FC = () => {
  return (
    <div className="bg-[#0C0E12] min-h-screen">
      <Header />
      
      <main className="w-full pt-6 pb-12 lg:pt-12 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-[#F7F7F7] text-xl sm:text-2xl font-semibold">
              BTC Bridge
            </h1>
          </div>
          
          {/* Widget Container */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl h-[80vh] min-h-[600px] bg-[#0C0E12] border border-[#22262F] rounded-lg">
              {/* The widget will render here automatically via the global script */}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BTCBridge;
