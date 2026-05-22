import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormSection } from './ui/form-section';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { FileUpload } from './ui/file-upload';
import { RichTextEditor } from './ui/rich-text-editor';
import { TagInput } from './ui/tag-input';
import { supabase } from "@/integrations/supabase/client";
import { isSingleAssetStrategy } from '@/lib/strategyUtils';

interface StrategyInfoFormData {
  featured: boolean;
  apy: number;
  tvl: number;
  risk_level: string;
  audited_by: string;
  asset: string;
  symbol: string;
  description: string;
  strategy_description: string;
  earn: string[];
  points: string;
  asset1_name: string;
  asset2_name: string;
  asset1_logo: string;
  asset2_logo: string;
  strategy_type: string;
  strategy_action: string;
  reward_program: string;
  video_guide: string;
  logo: string;
  protocol: string;
  chain: string;
}

interface StrategyInfoFormProps {
  onDataChange?: (data: Partial<StrategyInfoFormData>) => void;
  defaultValues?: Partial<StrategyInfoFormData>;
}

export const StrategyInfoForm: React.FC<StrategyInfoFormProps> = ({
  onDataChange,
  defaultValues
}) => {
  const [featured, setFeatured] = useState(true);
  const [earnTags, setEarnTags] = useState<string[]>([]);
  const [pointsValue, setPointsValue] = useState('');

  // Asset image states
  const [asset1Preview, setAsset1Preview] = useState<string>('');
  const [asset2Preview, setAsset2Preview] = useState<string>('');
  const [protocolLogoPreview, setProtocolLogoPreview] = useState<string>('');
  const [uploadingAsset1, setUploadingAsset1] = useState(false);
  const [uploadingAsset2, setUploadingAsset2] = useState(false);
  const [uploadingProtocolLogo, setUploadingProtocolLogo] = useState(false);

  const formDefaults = {
    featured: false,
    apy: 0,
    tvl: 0,
    risk_level: 'medium',
    audited_by: '',
    asset: '',
    symbol: '',
    description: '',
    strategy_description: '',
    earn: [],
    points: '',
    asset1_name: '',
    asset2_name: '',
    asset1_logo: '',
    asset2_logo: '',
    strategy_type: 'LP',
    strategy_action: '',
    reward_program: '',
    video_guide: '',
    logo: '',
    protocol: '',
    chain: '',
    ...defaultValues
  };

  const {
    register,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StrategyInfoFormData>({
    defaultValues: formDefaults
  });

  // Reset form when defaultValues change (for edit mode and scraped values)
  useEffect(() => {
    const newDefaults = {
      featured: false,
      apy: 0,
      tvl: 0,
      risk_level: 'medium',
      audited_by: '',
      asset: '',
      symbol: '',
      description: '',
      strategy_description: '',
      earn: [],
      points: '',
      asset1_name: '',
      asset2_name: '',
      asset1_logo: '',
      asset2_logo: '',
      strategy_type: 'LP',
      strategy_action: '',
      reward_program: '',
      video_guide: '',
      logo: '',
      protocol: '',
      chain: '',
      ...defaultValues
    };
    
    reset(newDefaults);
    setFeatured(newDefaults.featured ?? false);
    setEarnTags(newDefaults.earn || []);
    setPointsValue(newDefaults.points || '');
  }, [defaultValues, reset]);

  // Watch for specific APY and TVL changes and update form values directly
  useEffect(() => {
    if (defaultValues?.apy !== undefined) {
      setValue('apy', defaultValues.apy, { shouldValidate: true, shouldDirty: true });
    }
    if (defaultValues?.tvl !== undefined) {
      setValue('tvl', defaultValues.tvl, { shouldValidate: true, shouldDirty: true });
    }
  }, [defaultValues?.apy, defaultValues?.tvl, setValue]);

  // Description
  const description = watch('description');
  const asset1Name = watch('asset1_name');
  const asset2Name = watch('asset2_name');
  const asset1Logo = watch('asset1_logo');
  const asset2Logo = watch('asset2_logo');
  const protocolLogo = watch('logo');
  const strategyType = watch('strategy_type');
  const maxLength = 275;
  const remainingChars = maxLength - (description?.length || 0);

  // Set previews if logo values change
  useEffect(() => {
    setAsset1Preview(asset1Logo || '');
  }, [asset1Logo]);
  useEffect(() => {
    setAsset2Preview(asset2Logo || '');
  }, [asset2Logo]);
  useEffect(() => {
    setProtocolLogoPreview(protocolLogo || '');
  }, [protocolLogo]);

  // Generate preview based on strategy type
  const assetPreview = React.useMemo(() => {
    if (!asset1Name && !asset2Name) return '';
    if (!asset1Name) return asset2Name || '';
    
    // For single-asset strategies, show only Asset 1
    if (isSingleAssetStrategy(strategyType)) return asset1Name;
    
    if (!asset2Name) return asset1Name;
    
    // Use strategy_type to determine separator
    if (strategyType === 'LP') {
      return `${asset1Name} / ${asset2Name}`;
    } else if (strategyType === 'Bridge') {
      return `${asset1Name} → ${asset2Name}`;
    } else if (strategyType === 'Trading') {
      return `${asset1Name} / ${asset2Name}`;
    } else {
      return `${asset1Name} + ${asset2Name}`;
    }
  }, [asset1Name, asset2Name, strategyType]);

  // Image Upload Handlers
  const BUCKET = "asset-logos";
  
  const uploadAssetLogo = async (file: File, field: "asset1_logo" | "asset2_logo" | "logo") => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${field}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
      if (error) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}. Please check your permissions and try again.`);
        return;
      }
      
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      if (data?.publicUrl) {
        setValue(field, data.publicUrl, { shouldValidate: true, shouldDirty: true });
        if (field === "asset1_logo") setAsset1Preview(data.publicUrl);
        if (field === "asset2_logo") setAsset2Preview(data.publicUrl);
        if (field === "logo") setProtocolLogoPreview(data.publicUrl);
      }
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      alert('An unexpected error occurred during upload. Please try again.');
    }
  };

  const handleAsset1File = async (file: File) => {
    setUploadingAsset1(true);
    await uploadAssetLogo(file, "asset1_logo");
    setUploadingAsset1(false);
  };
  const handleAsset2File = async (file: File) => {
    setUploadingAsset2(true);
    await uploadAssetLogo(file, "asset2_logo");
    setUploadingAsset2(false);
  };
  const handleProtocolLogoFile = async (file: File) => {
    setUploadingProtocolLogo(true);
    await uploadAssetLogo(file, "logo");
    setUploadingProtocolLogo(false);
  };

  const watchedValues = watch();
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange({
        ...watchedValues,
        featured,
        earn: earnTags,
        points: pointsValue
      });
    }
  }, [watchedValues, featured, earnTags, pointsValue, onDataChange]);

  return (
    <FormSection title="Strategy Info" description="Update your strategy details here.">
      <div className="space-y-6">
        {/* Protocol Logo Upload Section */}
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex flex-col items-center min-w-32">
            <div className="w-16 h-16 rounded-lg bg-[#11131A] border border-[#373A41] flex items-center justify-center overflow-hidden mb-2">
              {protocolLogoPreview ? (
                <img src={protocolLogoPreview} alt="Protocol Logo" className="object-cover w-16 h-16" />
              ) : (
                <div className="text-xs text-[#94979C]">No Image</div>
              )}
            </div>
            <FileUpload onFileSelect={handleProtocolLogoFile} accept="image/*" className="mt-2 w-[112px]" />
            {uploadingProtocolLogo && <div className="text-xs text-[#75E0A7] mt-1 animate-pulse">Uploading...</div>}
            <div className="text-[11px] text-[#94979C] mt-1">Protocol Logo</div>
          </div>
        </div>

        {/* Asset Image Upload Section */}
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex flex-col items-center min-w-32">
            <div className="w-16 h-16 rounded-lg bg-[#11131A] border border-[#373A41] flex items-center justify-center overflow-hidden mb-2">
              {asset1Preview ? (
                <img src={asset1Preview} alt="Asset 1" className="object-cover w-16 h-16" />
              ) : (
                <div className="text-xs text-[#94979C]">No Image</div>
              )}
            </div>
            <FileUpload onFileSelect={handleAsset1File} accept="image/*" className="mt-2 w-[112px]" />
            {uploadingAsset1 && <div className="text-xs text-[#75E0A7] mt-1 animate-pulse">Uploading...</div>}
            <div className="text-[11px] text-[#94979C] mt-1">Asset 1 Image</div>
          </div>
          {!isSingleAssetStrategy(strategyType) && (
            <div className="flex flex-col items-center min-w-32">
              <div className="w-16 h-16 rounded-lg bg-[#11131A] border border-[#373A41] flex items-center justify-center overflow-hidden mb-2">
                {asset2Preview ? (
                  <img src={asset2Preview} alt="Asset 2" className="object-cover w-16 h-16" />
                ) : (
                  <div className="text-xs text-[#94979C]">No Image</div>
                )}
              </div>
              <FileUpload onFileSelect={handleAsset2File} accept="image/*" className="mt-2 w-[112px]" />
              {uploadingAsset2 && <div className="text-xs text-[#75E0A7] mt-1 animate-pulse">Uploading...</div>}
              <div className="text-[11px] text-[#94979C] mt-1">Asset 2 Image</div>
            </div>
          )}
        </div>


        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="apy" className="flex items-center gap-1 text-sm font-medium text-[#CECFD2]">
              APY (%)
              <span className="text-red-400">*</span>
            </label>
            <input 
              id="apy" 
              type="number" 
              step="0.01" 
              placeholder="e.g., 12.5"
              {...register('apy', {
                required: 'APY is required',
                min: { value: 0, message: 'APY must be positive' }
              })} 
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
            />
            {errors.apy && <p className="text-red-400 text-sm">{errors.apy.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="tvl" className="flex items-center gap-1 text-sm font-medium text-[#CECFD2]">
              TVL (USD)
              <span className="text-red-400">*</span>
            </label>
            <input 
              id="tvl" 
              type="number" 
              step="0.01" 
              placeholder="e.g., 1000000"
              {...register('tvl', {
                required: 'TVL is required',
                min: { value: 0, message: 'TVL must be positive' }
              })} 
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
            />
            {errors.tvl && <p className="text-red-400 text-sm">{errors.tvl.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="risk_level" className="flex items-center gap-1 text-sm font-medium text-[#CECFD2]">
              Risk Level
              <span className="text-red-400">*</span>
            </label>
            <Select onValueChange={value => setValue('risk_level', value)} value={watch('risk_level')}>
              <SelectTrigger className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent">
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent className="bg-[#0C0E12] border-[#373A41] z-50">
                <SelectItem value="low" className="text-[#F7F7F7] hover:bg-[#373A41]">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Low Risk
                  </span>
                </SelectItem>
                <SelectItem value="medium" className="text-[#F7F7F7] hover:bg-[#373A41]">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Medium Risk
                  </span>
                </SelectItem>
                <SelectItem value="high" className="text-[#F7F7F7] hover:bg-[#373A41]">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    High Risk
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* Audited By */}
        <div className="space-y-2">
          <label htmlFor="audited_by" className="flex items-center gap-1 text-sm font-medium text-[#CECFD2]">
            Audited by
            <span className="text-red-400">*</span>
          </label>
          <input 
            id="audited_by" 
            type="text" 
            placeholder="e.g., Certik, OpenZeppelin, ConsenSys Diligence"
            {...register('audited_by', {
              required: 'Security auditor is required'
            })} 
            className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
          />
          {errors.audited_by && <p className="text-red-400 text-sm">{errors.audited_by.message}</p>}
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label htmlFor="description" className="text-sm font-medium text-[#CECFD2]">
              Short Description
            </label>
            <HelpCircle className="w-4 h-4 text-[#94979C]" />
          </div>
          <textarea 
            id="description" 
            placeholder="Brief summary of the strategy for quick overview..."
            {...register('description', {
              maxLength: {
                value: maxLength,
                message: `Description must be ${maxLength} characters or less`
              }
            })} 
            className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent resize-none h-32" 
            rows={4} 
          />
          <div className="flex justify-between items-center">
            {errors.description && <p className="text-red-400 text-sm">{errors.description.message}</p>}
            <div className="text-[#94979C] text-sm ml-auto">
              {remainingChars} characters left
            </div>
          </div>
        </div>

        {/* Asset Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="asset1_name" className="text-sm font-medium text-[#CECFD2]">
              Primary Asset
            </label>
            <input 
              id="asset1_name" 
              type="text" 
              placeholder="e.g., ETH, USDC, WBTC"
              {...register('asset1_name')} 
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
            />
          </div>
          
          {!isSingleAssetStrategy(strategyType) && (
            <div className="space-y-2">
              <label htmlFor="asset2_name" className="text-sm font-medium text-[#CECFD2]">
                Secondary Asset
              </label>
              <input 
                id="asset2_name" 
                type="text" 
                placeholder="e.g., DAI, USDT, WETH"
                {...register('asset2_name')} 
                className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
              />
            </div>
          )}
        </div>

        {/* Strategy Type */}
        <div className="space-y-2">
          <label htmlFor="strategy_type" className="text-sm font-medium text-[#CECFD2]">
            Strategy Type
          </label>
          <Select onValueChange={value => setValue('strategy_type', value)} value={watch('strategy_type')}>
            <SelectTrigger className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent">
              <SelectValue placeholder="Select strategy type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C0E12] border-[#373A41] z-50">
              <SelectItem value="LP" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">Liquidity Provider (LP)</span>
                  <span className="text-xs text-[#94979C]">Provide liquidity to DEX pools</span>
                </div>
              </SelectItem>
              <SelectItem value="Borrow/Lending" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">Borrow/Lending</span>
                  <span className="text-xs text-[#94979C]">Lending and borrowing strategies</span>
                </div>
              </SelectItem>
              <SelectItem value="LST/Earn/Hold" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">LST/Earn/Hold</span>
                  <span className="text-xs text-[#94979C]">Liquid staking and holding strategies</span>
                </div>
              </SelectItem>
              <SelectItem value="On/Off Ramp" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">On/Off Ramp</span>
                  <span className="text-xs text-[#94979C]">Fiat to crypto conversion services</span>
                </div>
              </SelectItem>
              <SelectItem value="Crypto Card" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">Crypto Card</span>
                  <span className="text-xs text-[#94979C]">Cryptocurrency debit/credit cards</span>
                </div>
              </SelectItem>
              <SelectItem value="Bridge" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">Bridge</span>
                  <span className="text-xs text-[#94979C]">Cross-chain asset transfers</span>
                </div>
              </SelectItem>
              <SelectItem value="Trading" className="text-[#F7F7F7] hover:bg-[#373A41]">
                <div className="flex flex-col">
                  <span className="font-medium">Trading</span>
                  <span className="text-xs text-[#94979C]">Automated trading strategies</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Preview */}
        {assetPreview && (
          <div className="w-full font-medium gap-1.5 max-md:max-w-full">
            <div className="items-stretch flex w-full flex-col gap-1.5 max-md:max-w-full">
              <label className="text-[#CECFD2] text-sm leading-none gap-0.5">Asset Preview</label>
              <input 
                type="text" 
                value={assetPreview} 
                disabled 
                className="items-center border border-[#373A41] shadow-[0px_1px_2px_0px_rgba(255,255,255,0.00)] flex w-full gap-2 text-base text-[#94979C] font-normal bg-[#1A1D23] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid cursor-not-allowed" 
              />
            </div>
          </div>
        )}

        {/* Strategy Description */}
        <div className="min-h-[250px] w-full gap-1.5 max-md:max-w-full">
          <div className="items-stretch flex w-full flex-col flex-1 gap-1.5 max-md:max-w-full">
            <div className="items-center flex gap-0.5 text-sm font-medium whitespace-nowrap leading-none">
              <label htmlFor="strategy_description" className="text-[#CECFD2] text-sm leading-5">Strategy Description</label>
              <HelpCircle className="w-4 h-4 text-[#94979C]" />
            </div>
            <RichTextEditor
              content={watch('strategy_description') || ''}
              onChange={(content) => setValue('strategy_description', content, { shouldValidate: true, shouldDirty: true })}
              placeholder="Provide a detailed description of the strategy, including how it works, potential returns, and any important considerations..."
              maxLength={500}
              className="mt-1.5 focus-within:ring-2 focus-within:ring-[#75E0A7] focus-within:border-transparent"
            />
            {errors.strategy_description && <span className="text-red-400 text-sm mt-1">{errors.strategy_description.message}</span>}
          </div>
        </div>

        {/* Earn Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#CECFD2]">
              Earn
            </label>
            <HelpCircle className="w-4 h-4 text-[#94979C]" />
          </div>
          <TagInput
            value={earnTags}
            onChange={setEarnTags}
            placeholder="Add earning types (e.g., Tokens, Points, Yield)..."
            suggestions={['Tokens', 'Points', 'Yield', 'Rewards', 'Staking', 'LP Rewards', 'Airdrops', 'NFTs', 'Governance', 'Cashback']}
            maxTags={10}
          />
          <p className="text-xs text-[#94979C]">
            Add tags to describe what users can earn from this strategy. Press Enter or comma to add each tag.
          </p>
        </div>

        {/* Points */}
        <div className="space-y-2">
          <label htmlFor="points" className="text-sm font-medium text-[#CECFD2]">
            Points
          </label>
          <input 
            id="points" 
            type="text" 
            value={pointsValue}
            onChange={(e) => setPointsValue(e.target.value)}
            placeholder="e.g., EigenLayer Points, Blast Points, Hyperliquid Points"
            className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
          />
          <p className="text-xs text-[#94979C]">
            Specify any point systems or loyalty programs associated with this strategy.
          </p>
        </div>
      </div>
    </FormSection>
  );
};
