
import React from "react";
import { SimpleRiskBadge } from "./RiskBadge";
import { TagBadge } from "./TagBadge";
import { TableActionButtons } from "./ActionButtons";
import CachedImage from "./CachedImage";

interface TableRow {
  id: string;
  company: {
    name: string;
    iconSrc: string;
    asset2IconSrc?: string;
  };
  risk: "low" | "medium" | "high";
  tags: Array<{
    text: string;
    variant?: "primary" | "secondary" | "tertiary";
  }>;
  apy: string;
  tlv: string;
  videoUrl?: string | null;
  exploreUrl?: string | null;
}

interface DataTableRowProps {
  row: TableRow;
  onVideoClick: (id: string) => void;
  onExploreClick: (id: string) => void;
}

export const DataTableRow: React.FC<DataTableRowProps> = ({
  row,
  onVideoClick,
  onExploreClick,
}) => (
  <div className="flex w-full flex-wrap max-md:max-w-full px-[16px]">
    {/* Assets */}
    <div className="min-w-60 text-[#F7F7F7] flex-1 shrink basis-[0%]">
      <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 leading-none pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid px-0">
        <div className="relative w-[70px] h-[44px] flex items-center">
          <CachedImage
            id="asset1"
            src={row.company.iconSrc}
            alt="Asset 1"
            className="absolute left-0 w-8 h-8 rounded-full border-2 border-[#0C0E12] z-10"
          />
          {row.company.asset2IconSrc && (
            <CachedImage
              id="asset2"
              src={row.company.asset2IconSrc}
              alt="Asset 2"
              className="absolute left-6 w-8 h-8 rounded-full border-2 border-[#0C0E12]"
            />
          )}
        </div>
        <span className="text-[#F7F7F7] text-sm leading-[20px)]">
          {row.company.name}
        </span>
      </div>
    </div>
    {/* Risk */}
    <div className="text-xs text-[#CECFD2] whitespace-nowrap w-[119px]">
      <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
        <SimpleRiskBadge level={row.risk} className="self-stretch my-auto" />
      </div>
    </div>
    {/* Tag */}
    <div className="min-w-60 text-xs w-[322px]">
      <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full text-center pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
        <div className="self-stretch flex min-w-60 gap-1 my-auto">
          {row.tags.map((tag, index) => (
            <TagBadge
              key={index}
              text={tag.text}
              variant={tag.variant || "secondary"}
            />
          ))}
        </div>
      </div>
    </div>
    {/* APY */}
    <div className="text-[#17B26A] font-normal whitespace-nowrap w-[76px]">
      <div className="text-[#17B26A] text-sm leading-none border-b-[color:var(--Colors-Border-border-secondary,#22262F)] min-h-[72px] w-full pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] border-b border-solid max-md:px-5 flex items-center">
        {row.apy}
      </div>
    </div>
    {/* TLV */}
    <div className="text-[#94979C] font-normal w-[169px]">
      <div className="text-[#94979C] text-sm leading-none border-b-[color:var(--Colors-Border-border-secondary,#22262F)] min-h-[72px] w-full whitespace-nowrap pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] border-b border-solid max-md:px-5 flex items-center">
        {row.tlv}
      </div>
    </div>
    {/* Actions */}
    <div className="font-semibold leading-none w-[168px]">
      <div className="items-center border-b-[color:var(--Colors-Border-border-secondary,#22262F)] flex min-h-[72px] w-full gap-3 pr-[var(--spacing-3xl,] pl-[var(--spacing-3xl,] py-[16px)] border-b border-solid max-md:px-5">
        <TableActionButtons
          videoUrl={row.videoUrl}
          exploreUrl={row.exploreUrl}
        />
      </div>
    </div>
  </div>
);
