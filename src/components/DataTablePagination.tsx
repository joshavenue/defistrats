
import React from "react";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) => (
  <div className="justify-center items-center border-t-[color:var(--Colors-Border-border-secondary,#22262F)] flex w-full gap-3 text-[#CECFD2] leading-none flex-wrap border-t border-solid max-md:max-w-full px-[16px]">
    <div className="self-stretch flex min-w-60 gap-3 font-semibold whitespace-nowrap flex-wrap flex-1 shrink basis-[0%] my-auto max-md:max-w-full py-[16px] px-0">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="justify-center items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 overflow-hidden pr-[var(--spacing-lg,] pl-[var(--spacing-lg,] bg-[#0C0E12] py-[8px)] rounded-lg border-solid disabled:opacity-50 hover:bg-[#22262F] transition-colors"
        aria-label="Go to previous page"
      >
        <span className="text-[#CECFD2] text-sm leading-[20px)]">Previous</span>
      </button>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="justify-center items-center border border-[color:var(--Colors-Border-border-primary,#373A41)] shadow-[0px_0px_0px_1px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner-border,rgba(12,14,18,0.18))_inset,0px_-2px_0px_0px_var(--Colors-Effects-Shadows-shadow-skeumorphic-inner,rgba(12,14,18,0.05))_inset,0px_1px_2px_0px_var(--Colors-Effects-Shadows-shadow-xs,rgba(255,255,255,0.00))] flex gap-1 overflow-hidden pr-[var(--spacing-lg,] pl-[var(--spacing-lg,] bg-[#0C0E12] py-[8px)] rounded-lg border-solid disabled:opacity-50 hover:bg-[#22262F] transition-colors"
        aria-label="Go to next page"
      >
        <span className="text-[#CECFD2] text-sm leading-[20px)]">Next</span>
      </button>
    </div>
    <div className="text-[#CECFD2] text-sm font-medium leading-[20px)]" aria-live="polite">
      Page {currentPage} of {totalPages}
    </div>
  </div>
);
