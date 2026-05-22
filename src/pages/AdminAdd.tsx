
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { ProtocolInfoForm } from '@/components/ProtocolInfoForm';
import { StrategyInfoForm } from '@/components/StrategyInfoForm';
import { CTAInfoForm } from '@/components/CTAInfoForm';
import { APYTVLFetcher } from '@/components/APYTVLFetcher';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const AdminAdd = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const [isLoading, setIsLoading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [protocolData, setProtocolData] = useState<any>({});
  const [strategyData, setStrategyData] = useState<any>({});
  const [ctaData, setCTAData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Default values for forms
  const [protocolDefaults, setProtocolDefaults] = useState<any>({});
  const [strategyDefaults, setStrategyDefaults] = useState<any>({});
  const [ctaDefaults, setCTADefaults] = useState<any>({});
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published'>('published');

  // Timestamps for display
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Load existing data in edit mode
  useEffect(() => {
    const loadExistingData = async () => {
      if (!isEditMode || !editId) return;

      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('staking_assets')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) {
          setError(`Failed to load data: ${error.message}`);
          return;
        }

        if (data) {
          // Set timestamps
          setCreatedAt(data.created_at);
          setUpdatedAt(data.updated_at);
          
          // Set current status for display - handle case where status might not exist yet
          setCurrentStatus((data.status as 'draft' | 'published') || 'published');
          
          // Set protocol defaults
          setProtocolDefaults({
            protocol: data.protocol || '',
            chain: data.chain || '',
          });

          setStrategyDefaults({
            featured: data.featured || false,
            apy: data.apy || 0,
            tvl: data.tvl || 0,
            risk_level: data.risk_level || 'medium',
            audited_by: data.audited_by || '',
            asset: data.asset || '',
            symbol: data.symbol || '',
            description: data.description || '',
            strategy_description: data.strategy_description || '',
            earn: data.earn || [],
            points: data.points || '',
            asset1_name: data.asset1_name || '',
            asset2_name: data.asset2_name || '',
            asset1_logo: data.asset1_logo || '',
            asset2_logo: data.asset2_logo || '',
            strategy_type: data.strategy_type || 'Collaterized',
            strategy_action: data.strategy_action || '',
            reward_program: data.reward_program || '',
            video_guide: data.video_guide || '',
            logo: data.logo || '',
          });

          setCTADefaults({
            video: data.video_guide || '',
            ref: data.cta_link || '',
            website: data.cta_link || '',
          });
        }
      } catch (error: any) {
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [isEditMode, editId]);

  // Handle scraped values update
  const handleScrapedValuesUpdate = (values: { apy?: number; tvl?: number }) => {
    setStrategyData(prev => ({
      ...prev,
      ...values
    }));
    
    setStrategyDefaults(prev => ({
      ...prev,
      ...values
    }));
  };

  const composeDbData = (status: 'draft' | 'published' = 'published') => {
    const pd = protocolData as any;
    const sd = strategyData as any;
    const ctd = ctaData as any;

    let riskLevel = sd.risk_level;
    if (!riskLevel || !['low', 'medium', 'high'].includes(riskLevel)) {
      riskLevel = 'medium';
    }

    const dbData = {
      protocol: pd.protocol || "",
      chain: pd.chain || sd.chain || "",
      logo: sd.logo || "",
      asset: sd.asset || "",
      symbol: sd.symbol || "",
      apy: sd.apy ?? null,
      tvl: sd.tvl ?? null,
      risk_level: riskLevel,
      audited_by: sd.audited_by || "",
      asset1_name: sd.asset1_name || "",
      asset2_name: sd.asset2_name || "",
      asset1_logo: sd.asset1_logo || "",
      asset2_logo: sd.asset2_logo || "",
      description: sd.description || "",
      strategy_description: sd.strategy_description || "",
      earn: sd.earn || null,
      points: sd.points || null,
      strategy_type: sd.strategy_type || "",
      strategy_action: sd.strategy_action || "",
      reward_program: sd.reward_program || "",
      video_guide: sd.video_guide || "",
      featured: sd.featured === undefined ? false : sd.featured,
      cta_link: ctd.website || ctd.ref || ctd.video || "",
      price: 0,
      status: status,
    };

    return dbData;
  };

  const handleSubmit = async (status: 'draft' | 'published' = 'published') => {
    const isSubmittingDraft = status === 'draft';
    
    if (isSubmittingDraft) {
      setIsDraftLoading(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const dbData = composeDbData(status);

      let result: any;
      if (isEditMode && editId) {
        result = await supabase
          .from('staking_assets')
          .update(dbData)
          .eq('id', editId);
      } else {
        result = await supabase
          .from('staking_assets')
          .insert([dbData]);
      }

      if (result.error) {
        setError(result.error.message);
        console.error('Error submitting form:', result.error);
        return;
      }

      // Invalidate queries to refresh the data on all pages
      await queryClient.invalidateQueries({ queryKey: ['staking-assets'] });
      await queryClient.invalidateQueries({ queryKey: ['featured-assets'] });

      navigate('/admin/database');
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
      setIsDraftLoading(false);
    }
  };

  const handlePublish = () => handleSubmit('published');
  const handleSaveDraft = () => handleSubmit('draft');

  const handleCancel = () => {
    navigate('/admin/database');
  };

  if (isLoadingData) {
    return (
      <div className="bg-[#0C0E12] min-h-screen">
        <Header />
        <main className="w-full pt-12 pb-24 max-md:max-w-full">
          <div className="flex w-full flex-col items-center px-8 max-md:max-w-full max-md:px-5">
            <div className="max-w-screen-xl items-center flex w-full flex-col px-8 pt-0 pb-8 max-md:max-w-full max-md:px-5">
              <div className="text-[#CECFD2] text-center">Loading data...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#0C0E12] min-h-screen">
      <Header />

      <main className="w-full pt-8 pb-24">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-[#ECECED]">
              {isEditMode ? 'Edit Staking Asset' : 'Add New Staking Asset'}
            </h1>
            <p className="text-[#94979C] text-lg">
              {isEditMode ? 'Update the details for this staking opportunity' : 'Create a new staking opportunity for users'}
            </p>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#75E0A7] flex items-center justify-center">
                  <span className="text-[#0C0E12] font-semibold text-sm">1</span>
                </div>
                <span className="text-sm text-[#CECFD2]">Protocol</span>
              </div>
              <div className="w-8 h-px bg-[#373A41]"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#75E0A7] flex items-center justify-center">
                  <span className="text-[#0C0E12] font-semibold text-sm">2</span>
                </div>
                <span className="text-sm text-[#CECFD2]">Strategy</span>
              </div>
              <div className="w-8 h-px bg-[#373A41]"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#75E0A7] flex items-center justify-center">
                  <span className="text-[#0C0E12] font-semibold text-sm">3</span>
                </div>
                <span className="text-sm text-[#CECFD2]">Links</span>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="space-y-6">
            <ProtocolInfoForm onDataChange={setProtocolData} defaultValues={protocolDefaults} />
            <StrategyInfoForm onDataChange={setStrategyData} defaultValues={strategyDefaults} />
            <CTAInfoForm onDataChange={setCTAData} defaultValues={ctaDefaults} />

            {/* APY & TVL Fetcher - Only show in edit mode */}
            {isEditMode && editId && (
              <APYTVLFetcher 
                assetId={editId} 
                website={ctaData?.website || ctaDefaults?.website || ''}
                asset1Name={strategyData?.asset1_name || strategyDefaults?.asset1_name || ''}
                onConfigChange={() => {}}
                onValuesUpdate={handleScrapedValuesUpdate}
              />
            )}
          </div>

          {/* Timestamps Section - Only show in edit mode */}
          {isEditMode && (createdAt || updatedAt) && (
            <div className="bg-[#11131A] border border-[#373A41] rounded-lg p-6">
              <h3 className="text-lg font-medium text-[#ECECED] mb-4">Record Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdAt && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#CECFD2]">Created At</label>
                    <div className="text-sm text-[#94979C] bg-[#0C0E12] border border-[#373A41] rounded-lg px-3 py-2">
                      {format(new Date(createdAt), 'PPpp')}
                    </div>
                  </div>
                )}
                {updatedAt && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#CECFD2]">Last Modified</label>
                    <div className="text-sm text-[#94979C] bg-[#0C0E12] border border-[#373A41] rounded-lg px-3 py-2">
                      {format(new Date(updatedAt), 'PPpp')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t border-[#22262F]">
            {isEditMode && (
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent px-8"
                disabled={isLoading || isDraftLoading}
              >
                Cancel
              </Button>
            )}
            
            {/* Save as Draft Button */}
            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading || isDraftLoading}
              variant="outline"
              className="border-[#373A41] text-[#CECFD2] hover:bg-[#22262F] hover:text-[#F7F7F7] bg-transparent px-8 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDraftLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {isDraftLoading
                ? (isEditMode ? 'Saving Draft...' : 'Saving Draft...')
                : 'Save as Draft'
              }
            </Button>

            {/* Publish Button */}
            <Button
              type="button"
              onClick={handlePublish}
              disabled={isLoading || isDraftLoading}
              className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90 px-8 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {isLoading
                ? (isEditMode ? 'Publishing...' : 'Publishing...')
                : (isEditMode ? 'Update & Publish' : 'Publish Asset')
              }
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAdd;
