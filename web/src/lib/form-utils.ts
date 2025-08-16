import React from 'react';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s-]{10,}$/, 'Please enter a valid phone number');

// Common form field types
export type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
};

export type FormFieldConfig<T> = {
  initialValue: T;
  validate?: (value: T) => string | undefined;
};

// Form state management
export function createFormField<T>(config: FormFieldConfig<T>): FormField<T> {
  return {
    value: config.initialValue,
    error: undefined,
    touched: false,
  };
}

export function validateFormField<T>(
  field: FormField<T>,
  validate?: (value: T) => string | undefined
): FormField<T> {
  if (!validate) return { ...field, error: undefined };
  
  const error = validate(field.value);
  return { ...field, error };
}

// Form submission handler
export async function handleFormSubmit<T>(
  formData: T,
  submitFn: (data: T) => Promise<any>,
  options?: {
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  try {
    const result = await submitFn(formData);
    
    if (options?.successMessage) {
      toast({
        title: 'Success',
        description: options.successMessage,
        variant: 'default',
      });
    }
    
    if (options?.onSuccess) {
      options.onSuccess(result);
    }
    
    return { data: result, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    toast({
      title: 'Error',
      description: options?.errorMessage || errorMessage,
      variant: 'destructive',
    });
    
    if (options?.onError) {
      options.onError(error);
    }
    
    return { data: null, error };
  }
}

// Form field change handler
export function handleFieldChange<T>(
  field: FormField<T>,
  value: T,
  validate?: (value: T) => string | undefined
): FormField<T> {
  const newField = {
    ...field,
    value,
    touched: true,
  };
  
  return validateFormField(newField, validate);
}

// Form validation
export function validateForm<T>(
  fields: Record<keyof T, FormField<any>>,
  validations: Record<keyof T, (value: any) => string | undefined>
): [boolean, Record<keyof T, FormField<any>>] {
  let isValid = true;
  const updatedFields = { ...fields };
  
  for (const key in fields) {
    const field = fields[key];
    const validate = validations[key];
    
    if (validate) {
      const error = validate(field.value);
      updatedFields[key] = { ...field, error, touched: true };
      
      if (error) {
        isValid = false;
      }
    }
  }
  
  return [isValid, updatedFields];
}

// Common form validators
export const validators = {
  required: (message = 'This field is required') => 
    (value: any) => 
      !value ? message : undefined,
      
  minLength: (min: number, message = `Must be at least ${min} characters`) => 
    (value: string) => 
      value.length < min ? message : undefined,
      
  maxLength: (max: number, message = `Must be less than ${max} characters`) => 
    (value: string) => 
      value.length > max ? message : undefined,
      
  email: (message = 'Please enter a valid email address') => 
    (value: string) => 
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ? message : undefined,
      
  match: (otherValue: any, message = 'Values do not match') => 
    (value: any) => 
      value !== otherValue ? message : undefined,
};

// Hook for managing form state
export function useForm<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = React.useState<T>(initialState);
  const [errors, setErrors] = React.useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent, onSubmit: (data: T) => Promise<void>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle error (e.g., show error message)
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
    setErrors,
  };
}
