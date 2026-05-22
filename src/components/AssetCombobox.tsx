
import React from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";

interface AssetOption {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

interface AssetComboboxProps {
  value: string | undefined;
  onChange: (value: string, asset?: AssetOption) => void;
  assets: AssetOption[];
  loading?: boolean;
  label: string;
  disabled?: boolean;
  className?: string;
}

export const AssetCombobox: React.FC<AssetComboboxProps> = ({
  value,
  onChange,
  assets,
  loading,
  label,
  disabled,
  className
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (asset: AssetOption) => {
    onChange(asset.name, asset);
    setOpen(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <label className="text-[#CECFD2] text-sm leading-none gap-0.5 font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              "items-center border border-[#373A41] shadow flex w-full gap-2 text-base text-[#F7F7F7] font-normal bg-[#0C0E12] mt-1.5 px-3.5 py-2.5 rounded-lg border-solid focus:outline-none focus:ring-2 focus:ring-[#75E0A7] focus:border-transparent text-left",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            aria-label={`Select ${label}`}
          >
            {value ? (
              <div className="flex gap-2 items-center">
                {assets.find(a => a.name === value)?.thumb && (
                  <img
                    src={assets.find(a => a.name === value)?.thumb}
                    alt={value}
                    className="w-4 h-4"
                  />
                )}
                <span>{value}</span>
              </div>
            ) : (
              <span className="text-[#94979C]">{loading ? "Loading assets..." : `Select ${label}`}</span>
            )}
            <Search className="ml-auto w-4 h-4 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[280px] bg-[#0C0E12] border-[#373A41] z-50">
          <Command shouldFilter>
            <CommandInput placeholder={`Search ${label}...`} disabled={loading} />
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                <span>Loading assets...</span>
              </div>
            ) : (
              <CommandList>
                <CommandEmpty>No assets found</CommandEmpty>
                {assets.map(asset => (
                  <CommandItem
                    key={asset.id}
                    value={asset.name}
                    onSelect={() => handleSelect(asset)}
                  >
                    <img src={asset.thumb} alt={asset.name} className="w-4 h-4 mr-2" />
                    {asset.name}
                    <span className="ml-auto uppercase text-xs text-[#94979C]">{asset.symbol}</span>
                  </CommandItem>
                ))}
              </CommandList>
            )}
          </Command>
          {/* Allow user to type and add any value */}
          <div className="border-t border-[#373A41] px-3 py-2 bg-[#181b20]">
            <input
              type="text"
              className="w-full bg-transparent outline-none text-[#F7F7F7] placeholder:text-[#94979C]"
              placeholder={`Or enter ${label} manually...`}
              value={value || ""}
              onChange={e => onChange(e.target.value)}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
