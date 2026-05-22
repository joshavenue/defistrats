import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormSection } from './ui/form-section';
import { FileUpload } from './ui/file-upload';
interface ProtocolInfoFormData {
  protocolLink: string;
  protocol: string;
  chain: string;
  avatar?: File;
}
interface ProtocolInfoFormProps {
  onDataChange?: (data: ProtocolInfoFormData & {
    avatar?: File;
  }) => void;
  defaultValues?: Partial<ProtocolInfoFormData>;
}
export const ProtocolInfoForm: React.FC<ProtocolInfoFormProps> = ({
  onDataChange,
  defaultValues
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    register,
    formState: {
      errors
    },
    watch,
    reset
  } = useForm<ProtocolInfoFormData>({
    defaultValues: {
      protocolLink: '',
      protocol: '',
      chain: '',
      ...defaultValues
    }
  });

  // Reset form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset({
        protocolLink: '',
        protocol: '',
        chain: '',
        ...defaultValues
      });
    }
  }, [defaultValues, reset]);

  // Watch for changes and notify parent
  const watchedValues = watch();
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange({
        ...watchedValues,
        avatar: selectedFile || undefined
      });
    }
  }, [watchedValues, selectedFile, onDataChange]);
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };
  return <FormSection title="Protocol Information" description="Basic information about the protocol and blockchain">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="protocol" className="flex items-center gap-1 text-sm font-medium text-[#CECFD2]">
              Protocol Name
              <span className="text-red-400">*</span>
            </label>
            <input 
              id="protocol" 
              type="text" 
              placeholder="e.g., Aave, Compound, Uniswap"
              {...register('protocol', {
                required: 'Protocol name is required'
              })} 
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
            />
            {errors.protocol && <p className="text-red-400 text-sm flex items-center gap-1">{errors.protocol.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="chain" className="text-sm font-medium text-[#CECFD2]">
              Blockchain Network
            </label>
            <input 
              id="chain" 
              type="text" 
              placeholder="e.g., Ethereum, Polygon, Arbitrum"
              {...register('chain')} 
              className="w-full px-4 py-3 text-base text-[#F7F7F7] bg-[#0C0E12] border border-[#373A41] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent" 
            />
          </div>
        </div>
      </div>
    </FormSection>;
};