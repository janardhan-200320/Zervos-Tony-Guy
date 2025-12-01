import { Badge } from '@/components/ui/badge';

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  selectionMode?: 'single' | 'multiple';
}

export default function ChipSelector({ options, selected, onChange, label, selectionMode = 'multiple' }: ChipSelectorProps) {
  const toggleOption = (option: string) => {
    if (selectionMode === 'single') {
      // In single mode, clicking the same option will keep it selected
      onChange([option]);
      return;
    }

    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-foreground">
        {label}
        {label.includes('industry') && <span className="text-destructive">*</span>}
      </h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all border
                ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover-elevate'
                }
              `}
              data-testid={`chip-${option.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
