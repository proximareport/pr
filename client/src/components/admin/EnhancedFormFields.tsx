import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { GripHorizontal } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  className?: string;
}

export function FormField({ 
  id, 
  label, 
  children,
  hint,
  className = ""
}: FormFieldProps & { 
  children: React.ReactNode;
  hint?: string; 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-lg font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-white/60 mt-1">{hint}</p>}
    </div>
  );
}

export function TextFormField({ 
  id, 
  label, 
  value, 
  onChange,
  placeholder,
  hint,
  className = "",
  required = false,
  isLarge = false
}: FormFieldProps & { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  isLarge?: boolean;
}) {
  return (
    <FormField id={id} label={label} hint={hint} className={className}>
      <Input 
        id={id} 
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${isLarge ? 'h-12 text-lg' : ''} border-white/10 bg-[#1A1A27] focus:border-primary/50 focus:ring-1 focus:ring-primary/20`}
      />
    </FormField>
  );
}

export function TextareaFormField({ 
  id, 
  label, 
  value, 
  onChange,
  placeholder,
  hint,
  className = "",
  required = false,
  rows = 3
}: FormFieldProps & { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <FormField id={id} label={label} hint={hint} className={className}>
      <Textarea 
        id={id} 
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="min-h-[100px] border-white/10 bg-[#1A1A27] focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
      />
    </FormField>
  );
}

export function SelectFormField<T extends string>({ 
  id, 
  label, 
  value, 
  onChange,
  options,
  placeholder,
  hint,
  className = "",
  required = false
}: FormFieldProps & { 
  value: T; 
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <FormField id={id} label={label} hint={hint} className={className}>
      <Select 
        value={value} 
        onValueChange={onChange as (value: string) => void}
        required={required}
      >
        <SelectTrigger className="border-white/10 bg-[#1A1A27]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

export function CheckboxFormField({ 
  id, 
  label, 
  checked, 
  onChange,
  hint,
  className = "",
  highlightBox = false,
  description
}: FormFieldProps & { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  hint?: string;
  highlightBox?: boolean;
  description?: string;
}) {
  const content = (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={id} 
          checked={checked} 
          onCheckedChange={onChange}
          className={highlightBox ? "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600" : ""}
        />
        <div>
          <Label htmlFor={id} className="cursor-pointer font-medium">
            {label}
          </Label>
          {description && <p className="text-xs text-white/60 mt-1">{description}</p>}
        </div>
      </div>
      {hint && <p className="text-xs text-white/60 mt-1">{hint}</p>}
    </>
  );

  if (highlightBox) {
    return (
      <div className={`bg-[#1A1A27] p-4 rounded-lg border border-white/10 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {content}
    </div>
  );
}

export function SlugFormField({ 
  id, 
  label, 
  value, 
  onChange,
  placeholder,
  hint,
  className = "",
  required = false
}: FormFieldProps & { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <FormField id={id} label={label} hint={hint} className={className}>
      <div className="relative">
        <Input 
          id={id} 
          value={value} 
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="border-white/10 bg-[#1A1A27] pl-10 focus:border-primary/50"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40">
          /
        </div>
      </div>
    </FormField>
  );
}

export function DragHandle() {
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
      <GripHorizontal className="w-3 h-3 mr-1" />
      Drag to reorder
    </span>
  );
}