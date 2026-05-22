
import React, { useRef, useState } from 'react';
import { X, Upload, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
  maxSizeInMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "*/*",
  className = "",
  maxSizeInMB = 5
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    // Check file type if accept is specified and not wildcard
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isValid = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return type.toLowerCase() === fileExtension;
        }
        return fileType.match(type.replace('*', '.*'));
      });

      if (!isValid) {
        return `File type not supported. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const createPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const handleFileSelection = async (file: File) => {
    setError('');
    setIsUploading(true);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      return;
    }

    setSelectedFile(file);
    createPreview(file);
    
    try {
      await onFileSelect(file);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div 
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-[#75E0A7] bg-[#75E0A7]/5' 
            : selectedFile 
              ? 'border-[#75E0A7] bg-[#75E0A7]/5' 
              : 'border-[#373A41] hover:border-[#75E0A7]'
          }
          ${isUploading ? 'cursor-wait opacity-75' : ''}
          ${error ? 'border-red-500 bg-red-500/5' : ''}
        `}
      >
        {selectedFile ? (
          <div className="space-y-3">
            {preview && (
              <div className="flex justify-center">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border border-[#373A41]"
                />
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2">
              {isUploading ? (
                <Upload className="w-4 h-4 text-[#75E0A7] animate-pulse" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#75E0A7]" />
              )}
              <File className="w-4 h-4 text-[#CECFD2]" />
            </div>
            
            <div className="space-y-1">
              <div className="text-[#CECFD2] text-sm font-medium truncate max-w-[200px] mx-auto">
                {selectedFile.name}
              </div>
              <div className="text-[#94979C] text-xs">
                {formatFileSize(selectedFile.size)}
              </div>
              {isUploading && (
                <div className="text-[#75E0A7] text-xs">
                  Uploading...
                </div>
              )}
            </div>
            
            {!isUploading && (
              <button
                onClick={handleRemoveFile}
                className="inline-flex items-center gap-1 text-[#94979C] hover:text-red-400 text-xs transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              {error ? (
                <AlertCircle className="w-8 h-8 text-red-400" />
              ) : (
                <Upload className={`w-8 h-8 ${isDragging ? 'text-[#75E0A7]' : 'text-[#94979C]'}`} />
              )}
            </div>
            
            <div className="space-y-1">
              <div className={`text-sm font-medium ${error ? 'text-red-400' : 'text-[#CECFD2]'}`}>
                {error || (isDragging ? 'Drop your file here' : 'Click to upload or drag and drop')}
              </div>
              {!error && (
                <div className="text-[#94979C] text-xs">
                  {accept === 'image/*' 
                    ? `Images up to ${maxSizeInMB}MB` 
                    : `Files up to ${maxSizeInMB}MB`
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
