import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  value: string;
  label: string;
}

interface TableFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  widthClass?: string;
}

export function TableFilter({
  value,
  onValueChange,
  options,
  placeholder = "Select filter",
  widthClass = "w-[160px]",
}: TableFilterProps) {
  const currentOption = options.find((o) => o.value === value);

  return (
    <Select 
      value={value} 
      onValueChange={(val) => {
        if (val !== null) {
          onValueChange(val);
        }
      }}
    >
      <SelectTrigger className={`bg-white shrink-0 ${widthClass}`}>
        <SelectValue placeholder={placeholder}>
          {currentOption ? currentOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
