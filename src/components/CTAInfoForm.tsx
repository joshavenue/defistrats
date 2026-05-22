
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormSection } from './ui/form-section';

interface CTAInfoFormData {
  video: string;
  ref: string;
  website: string;
}

interface CTAInfoFormProps {
  onDataChange?: (data: CTAInfoFormData) => void;
  defaultValues?: Partial<CTAInfoFormData>;
}

export const CTAInfoForm: React.FC<CTAInfoFormProps> = ({ 
  onDataChange, 
  defaultValues 
}) => {
  const {
    register,
    formState: { errors },
    watch,
    reset
  } = useForm<CTAInfoFormData>({
    defaultValues: {
      video: '',
      ref: '',
      website: '',
      ...defaultValues
    }
  });

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        video: '',
        ref: '',
        website: '',
        ...defaultValues
      });
    }
  }, [defaultValues, reset]);

  // Watch for changes and notify parent
  const watchedValues = watch();
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange(watchedValues);
    }
  }, [watchedValues, onDataChange]);

  return (
    <FormSection
      title="Call-to-Action Links"
      description="External links and resources for this staking opportunity"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="video" className="text-sm font-medium text-[#CECFD2]">
              Video Guide
            </label>
            <input
              id="video"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              {...register('video', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              })}
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            {errors.video && (
              <p className="text-red-400 text-sm">{errors.video.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="ref" className="text-sm font-medium text-[#CECFD2]">
              Referral Link
            </label>
            <input
              id="ref"
              type="url"
              placeholder="https://protocol.com/ref/..."
              {...register('ref', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              })}
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent"
            />
            {errors.ref && (
              <p className="text-red-400 text-sm">{errors.ref.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="ctaWebsite" className="flex items-center gap-1 text-sm font-medium text-[#CECFD2]">
            Protocol Website
            <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center border border-[#373A41] rounded-lg bg-[#0C0E12] transition-colors focus-within:ring-2 focus-within:ring-[#75E0A7] focus-within:border-transparent">
            <span className="text-[#94979C] px-4 py-3 text-base">https://</span>
            <input
              id="ctaWebsite"
              type="text"
              placeholder="app.protocol.com"
              {...register('website', { required: 'Website is required' })}
              className="flex-1 px-2 py-3 pr-4 text-base text-[#F7F7F7] bg-transparent border-none outline-none"
            />
          </div>
          {errors.website && (
            <p className="text-red-400 text-sm">{errors.website.message}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
};
