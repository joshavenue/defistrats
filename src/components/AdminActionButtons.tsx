
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface AdminActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export const AdminActionButtons: React.FC<AdminActionButtonsProps> = ({
  onEdit,
  onDelete,
  className = ''
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={onEdit}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#22262F] hover:bg-[#2A2F38] border border-[#373A41] transition-colors"
        aria-label="Edit item"
      >
        <Edit className="w-4 h-4 text-[#84CAFF]" />
      </button>
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#22262F] hover:bg-[#2A2F38] border border-[#373A41] transition-colors"
        aria-label="Delete item"
      >
        <Trash2 className="w-4 h-4 text-[#FF6B6B]" />
      </button>
    </div>
  );
};
