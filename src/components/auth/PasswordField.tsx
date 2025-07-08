import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface PasswordFieldProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  fieldName: string;
  label?: string;
  placeholder?: string;
}

export const PasswordField = ({ 
  register, 
  errors, 
  fieldName, 
  label = "Password",
  placeholder = "masukkan password" 
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName} className="dark:text-gray-300">{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={fieldName}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          {...register(fieldName)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {errors[fieldName] && (
        <p className="text-sm text-red-600">
          {errors[fieldName]?.message as string}
        </p>
      )}
    </div>
  );
};