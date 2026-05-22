import React from 'react';
interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children
}) => {
  return <div className="border border-[#22262F] shadow-[0px_1px_3px_0px_rgba(255,255,255,0.00)] bg-[#13161B] w-full overflow-hidden rounded-xl max-md:max-w-full">
      <div className="flex w-full flex-col px-6 py-6 max-md:max-w-full max-md:px-5">
        <div className="flex w-full gap-8 flex-wrap max-md:max-w-full">
          <div className="min-w-60 flex-1 shrink basis-[0%] max-md:max-w-full">
            <div className="flex w-full flex-col max-md:max-w-full">
              <div className="text-[#ECECED] text-lg font-semibold leading-7 max-md:max-w-full">
                {title}
              </div>
              <div className="text-[#94979C] text-sm font-normal leading-5 mt-1 max-md:max-w-full">
                {description}
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full mt-8 max-md:max-w-full my-[16px]">
          {children}
        </div>
      </div>
    </div>;
};