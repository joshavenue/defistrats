import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, ExternalLink, Shield, TrendingUp, DollarSign, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SimpleRiskBadge } from '@/components/RiskBadge';
import { TagBadge } from '@/components/TagBadge';
import { supabase } from '@/integrations/supabase/client';
import { normalizeUrl } from '@/lib/urlUtils';
import { trackLinkClick } from '@/lib/analytics';
import { parseStrategyUrl } from '@/utils/urlUtils';
import { getDisplayAssetName } from '@/lib/strategyUtils';
import { Button } from '@/components/ui/button';
import { ROICalculator } from '@/components/ROICalculator';
import { ScrambleText } from '@/components/ScrambleText';
import { sanitizeRichTextHtml } from '@/lib/htmlSanitizer';
const StrategyDetail: React.FC = () => {
  const {
    protocol,
    assets
  } = useParams<{
    protocol: string;
    assets: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Handle back navigation with preserved filters
  const handleBackClick = () => {
    const returnUrl = location.state?.returnUrl;
    if (returnUrl) {
      navigate(returnUrl);
    } else {
      navigate('/');
    }
  };

  // Fetch strategy data using TanStack Query
  const { data: allStrategies, isLoading, error } = useQuery({
    queryKey: ['staking-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staking_assets')
        .select('*')
        .eq('status', 'published');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Find the matching strategy from the cached data
  const strategy = React.useMemo(() => {
    if (!allStrategies || !protocol || !assets) return null;

    try {
      // Parse URL parameters
      const {
        protocol: protocolName,
        assets: assetNames,
        strategyType,
        strategyId
      } = parseStrategyUrl(protocol, assets);

      // If we have a strategy ID, use it for exact matching (most precise)
      if (strategyId) {
        const idMatch = allStrategies.find(item => 
          item.id.toLowerCase().startsWith(strategyId.toLowerCase())
        );
        if (idMatch) {
          return idMatch;
        }
      }

      // Filter strategies by protocol
      const protocolMatches = allStrategies.filter(item => 
        item.protocol.toLowerCase().includes(protocolName.toLowerCase())
      );

      if (protocolMatches.length === 0) return null;

      // If we have asset names, try to match them
      if (assetNames.length > 0) {
        const assetMatches = protocolMatches.filter(item => 
          item.asset1_name?.toLowerCase().includes(assetNames[0].toLowerCase()) ||
          item.asset?.toLowerCase().includes(assetNames[0].toLowerCase())
        );

        if (assetMatches.length > 0) {
          // If we have a strategy type, use it for precise matching
          if (strategyType) {
            const strategyTypeMatch = assetMatches.find(item => 
              item.strategy_type?.toLowerCase() === strategyType.toLowerCase()
            );
            if (strategyTypeMatch) {
              return strategyTypeMatch;
            }
          }

          // Find the best match without strategy type
          let bestMatch = assetMatches[0];
          if (assetMatches.length > 1) {
            const exactMatch = assetMatches.find(item => {
              const displayName = getDisplayAssetName(item).toLowerCase();
              const urlAssets = assets.replace(/-/g, ' ').toLowerCase();
              return displayName.includes(urlAssets) || urlAssets.includes(displayName);
            });
            if (exactMatch) {
              bestMatch = exactMatch;
            }
          }
          return bestMatch;
        }
      }

      return protocolMatches[0];
    } catch (err) {
      console.error('Error parsing strategy URL:', err);
      return null;
    }
  }, [allStrategies, protocol, assets]);

  // Trigger scramble text animation when strategy is loaded
  useEffect(() => {
    if (strategy && !pageLoaded) {
      setTimeout(() => setPageLoaded(true), 100);
    }
  }, [strategy, pageLoaded]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_superadmin')
          .eq('id', user.id)
          .single();
        
        if (profile && (profile.is_admin || profile.is_superadmin)) {
          setIsAdmin(true);
        }
      }
    };
    
    checkAdminStatus();
  }, []);
  const handleVideoClick = async () => {
    if (strategy?.video_guide) {
      trackLinkClick(strategy.id, 'video', strategy.video_guide);
      window.open(normalizeUrl(strategy.video_guide), '_blank', 'noopener,noreferrer');
    }
  };
  const handleExploreClick = async () => {
    if (strategy?.cta_link) {
      trackLinkClick(strategy.id, 'explore', strategy.cta_link);
      window.open(normalizeUrl(strategy.cta_link), '_blank', 'noopener,noreferrer');
    }
  };
  const getRiskLevelText = (risk: string | null) => {
    switch (risk) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown Risk';
    }
  };
  if (isLoading) {
    return <div className="bg-[#0C0E12] min-h-screen relative">
        <Header />
        <main className="w-full pt-6 pb-12 lg:pt-12 lg:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-[#F7F7F7] text-center py-8">Loading strategy details...</div>
          </div>
        </main>
        <Footer />
      </div>;
  }
  if (error || (!isLoading && !strategy)) {
    return <div className="bg-[#0C0E12] min-h-screen relative">
        <Header />
        <main className="w-full pt-6 pb-12 lg:pt-12 lg:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button onClick={handleBackClick} className="flex items-center gap-2 text-[#94979C] hover:text-[#F7F7F7] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Strategies
            </button>
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-[#F7F7F7] mb-4">Strategy Not Found</h1>
              <p className="text-[#94979C] mb-6">{error?.message || 'The strategy you are looking for could not be found.'}</p>
              <button onClick={handleBackClick} className="bg-[#75E0A7] text-[#0C0E12] px-6 py-2 rounded-lg font-medium hover:bg-[#75E0A7]/90 transition-colors">
                View All Strategies
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>;
  }
  return <div className="bg-[#0C0E12] min-h-screen relative">
      <Header />
      
      <main className="w-full pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-12 lg:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Back Button */}
          <button onClick={handleBackClick} className="flex items-center gap-2 text-[#94979C] hover:text-[#F7F7F7] transition-colors mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Strategies
          </button>

          {/* Two Column Layout */}
          <div className={`grid grid-cols-1 gap-4 lg:gap-6 ${strategy.apy > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-1 lg:max-w-4xl lg:mx-auto'}`}>
            {/* Left Column - Strategy Details (2/3 width) */}
            <div className={`space-y-4 sm:space-y-6 ${strategy.apy > 0 ? 'lg:col-span-2' : ''}`}>
              {/* Strategy Header */}
              <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-4">
                {/* Protocol Logo */}
                <div className="flex items-center gap-3">
                  <img src={strategy.logo || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true'} alt={strategy.protocol} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <ScrambleText 
                      as="h1" 
                      className="text-lg sm:text-2xl font-bold text-[#F7F7F7] truncate"
                      duration={1.0}
                      delay={0.2}
                      triggerOnce={true}
                      trigger={pageLoaded}
                    >
                      {getDisplayAssetName(strategy)}
                    </ScrambleText>
                    <ScrambleText 
                      as="p" 
                      className="text-sm sm:text-base text-[#94979C] truncate"
                      duration={0.8}
                      delay={0.5}
                      triggerOnce={true}
                      trigger={pageLoaded}
                    >
                      {strategy.protocol}
                    </ScrambleText>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <SimpleRiskBadge level={strategy.risk_level as 'low' | 'medium' | 'high'} showSuffix />
                {strategy.chain && <TagBadge text={strategy.chain} variant="tertiary" />}
                {isAdmin && (
                  <Button
                    onClick={() => navigate(`/admin/add?edit=${strategy.id}`)}
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7]"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 hidden">
              <div className="bg-[#181B20]/80 backdrop-blur-sm border border-[#22262F] rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#75E0A7]" />
                  <span className="text-sm text-[#94979C]">APY</span>
                </div>
                 <div className="text-xl sm:text-2xl font-bold text-[#75E0A7]">
                   {strategy.apy.toFixed(2)}%
                 </div>
              </div>
              {strategy.tvl && strategy.tvl > 0 && <div className="bg-[#181B20]/80 backdrop-blur-sm border border-[#22262F] rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-[#94979C]" />
                    <span className="text-sm text-[#94979C]">TVL</span>
                  </div>
                   <div className="text-xl sm:text-2xl font-bold text-[#F7F7F7]">
                     {strategy.tvl ? `$${Number(strategy.tvl).toLocaleString()}` : '$0'}
                   </div>
                </div>}
            </div>

            {/* Asset Icons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h3 className="text-sm font-semibold text-[#F7F7F7]">Assets</h3>
              <div className="flex items-center">
                <img src={strategy.asset1_logo || 'https://cdn.builder.io/api/v1/image/assets/78d12036a5c64c769a608eb5e47e1f4f/88c135f151c162d6a86daa75c9c3045bbf7fe294?placeholderIfAbsent=true'} alt="Asset 1" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[#13161B]" />
                {strategy.asset2_logo && strategy.strategy_type !== 'LST/Earn/Hold' && strategy.strategy_type !== 'On/Off Ramp' && strategy.strategy_type !== 'Crypto Card' && <img src={strategy.asset2_logo} alt="Asset 2" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[#13161B] -ml-2" />}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {strategy.video_guide && <button onClick={handleVideoClick} className="flex items-center gap-2 bg-[#22262F] text-[#F7F7F7] px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-[#2A3037] transition-colors text-sm sm:text-base justify-center sm:justify-start">
                  <Play className="w-4 h-4" />
                  <span className="truncate">Watch Guide</span>
                </button>}
              {strategy.cta_link && <button onClick={handleExploreClick} className="flex items-center gap-2 bg-[#75E0A7] text-[#0C0E12] px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-[#75E0A7]/90 transition-colors text-sm sm:text-base font-medium justify-center sm:justify-start">
                  <ExternalLink className="w-4 h-4" />
                  <span className="truncate">Try This Strategy Now</span>
                </button>}
                </div>
              </div>

              {/* Strategy Description */}
              {strategy.strategy_description && (
                <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-[#F7F7F7] mb-3 sm:mb-4">Strategy Details</h2>
                  <div className="text-[#94979C] leading-relaxed rich-text-content text-sm sm:text-base overflow-hidden" dangerouslySetInnerHTML={{
                    __html: sanitizeRichTextHtml(strategy.strategy_description)
                  }} />
                </div>
              )}

              {/* Security Information */}
              <div className="bg-[#13161B]/80 backdrop-blur-sm border border-[#22262F] rounded-xl p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-[#F7F7F7] mb-3 sm:mb-4">Security Information</h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#75E0A7] flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-[#F7F7F7]">Risk Level</p>
                      <p className="text-xs sm:text-sm text-[#94979C] truncate">{getRiskLevelText(strategy.risk_level)}</p>
                    </div>
                  </div>
                  {strategy.audited_by && (
                    <div className="flex items-start sm:items-center gap-3">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#75E0A7] flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-[#F7F7F7]">Audited By</p>
                        <p className="text-xs sm:text-sm text-[#94979C] break-words">{strategy.audited_by}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - ROI Calculator (1/3 width) */}
            {strategy.apy > 0 && (
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-4">
                  <ROICalculator apy={strategy.apy} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>;
};
export default StrategyDetail;
