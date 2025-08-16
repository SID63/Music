import { useState, useCallback } from 'react';
import { z, ZodTypeAny } from 'zod';
import { toast } from '@/components/ui/use-toast';
import { handleApiError } from '@/lib/api-utils';

// Type for form fields
type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
};

// Type for form state
type FormState<T extends Record<string, any>> = {
  [K in keyof T]: FormField<T[K]>;
};

// Type for form validation schema
type FormValidationSchema<T> = {
  [K in keyof T]?: (value: T[K]) => string | undefined;
};

// Type for form submission handler
type SubmitHandler<T> = (data: T) => Promise<any>;

// Type for form options
type UseFormOptions<T> = {
  initialValues: T;
  validationSchema?: FormValidationSchema<T>;
  onSubmit: SubmitHandler<T>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
};

// Type for the return value of useForm
type UseFormReturn<T> = {
  // Form state
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  
  // Form actions
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void;
  setFieldTouched: (name: keyof T, touched?: boolean) => void;
  setFieldError: (name: keyof T, error?: string) => void;
  resetForm: () => void;
  
  // Form submission
  submitForm: () => Promise<void>;
};

// Helper function to initialize form state
function initializeFormState<T extends Record<string, any>>(
  initialValues: T
): FormState<T> {
  return Object.keys(initialValues).reduce((acc, key) => {
    return {
      ...acc,
      [key]: {
        value: initialValues[key],
        error: undefined,
        touched: false,
      },
    };
  }, {} as FormState<T>);
}

// Main form hook
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  onSubmit,
  onSuccess,
  onError,
  successMessage,
  errorMessage = 'An error occurred. Please try again.',
}: UseFormOptions<T>): UseFormReturn<T> {
  // Initialize form state
  const [formState, setFormState] = useState<FormState<T>>(() =>
    initializeFormState(initialValues)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | undefined => {
      const validator = validationSchema[name];
      return validator ? validator(value) : undefined;
    },
    [validationSchema]
  );

  // Validate the entire form
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    const newFormState = { ...formState };

    // Validate each field
    (Object.keys(formState) as Array<keyof T>).forEach((key) => {
      const field = formState[key];
      const error = validateField(key, field.value);
      
      if (error) {
        isValid = false;
        newFormState[key] = {
          ...field,
          error,
          touched: true,
        };
      } else if (field.error) {
        newFormState[key] = {
          ...field,
          error: undefined,
        };
      }
    });

    if (!isValid) {
      setFormState(newFormState);
    }

    return isValid;
  }, [formState, validateField]);

  // Handle field change
  const handleChange = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      const error = validateField(name, value);
      
      setFormState((prev) => ({
        ...prev,
        [name]: {
          value,
          error,
          touched: true,
        },
      }));
    },
    [validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (name: keyof T) => {
      const field = formState[name];
      const error = validateField(name, field.value);
      
      setFormState((prev) => ({
        ...prev,
        [name]: {
          ...field,
          error,
          touched: true,
        },
      }));
    },
    [formState, validateField]
  );

  // Set field value
  const setFieldValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      handleChange(name, value);
    },
    [handleChange]
  );

  // Set field touched
  const setFieldTouched = useCallback(
    (name: keyof T, touched = true) => {
      setFormState((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          touched,
        },
      }));
    },
    []
  );

  // Set field error
  const setFieldError = useCallback(
    (name: keyof T, error?: string) => {
      setFormState((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          error,
        },
      }));
    },
    []
  );

  // Reset form
  const resetForm = useCallback(() => {
    setFormState(initializeFormState(initialValues));
  }, [initialValues]);

  // Submit handler
  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    
    // Validate all fields
    const isValid = validateForm();
    
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Extract values from form state
      const values = Object.entries(formState).reduce((acc, [key, field]) => {
        return {
          ...acc,
          [key]: (field as FormField<any>).value,
        };
      }, {} as T);
      
      // Call the submit handler
      const result = await onSubmit(values);
      
      // Show success message
      if (successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        });
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      // Handle API errors
      const apiError = await handleApiError(error, errorMessage);
      
      // Show error message
      toast({
        title: 'Error',
        description: apiError.message,
        variant: 'destructive',
      });
      
      // Call error callback
      if (onError) {
        onError(apiError);
      }
      
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, onSubmit, onSuccess, onError, successMessage, errorMessage, validateForm]);
  
  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      await submitForm();
    },
    [submitForm]
  );
  
  // Extract values, errors, and touched state
  const values = Object.entries(formState).reduce((acc, [key, field]) => {
    return {
      ...acc,
      [key]: (field as FormField<any>).value,
    };
  }, {} as T);
  
  const errors = Object.entries(formState).reduce((acc, [key, field]) => {
    return {
      ...acc,
      [key]: (field as FormField<any>).error,
    };
  }, {} as Record<keyof T, string | undefined>);
  
  const touched = Object.entries(formState).reduce((acc, [key, field]) => {
    return {
      ...acc,
      [key]: (field as FormField<any>).touched,
    };
  }, {} as Record<keyof T, boolean>);
  
  // Check if form is valid
  const isValid = Object.values(errors).every((error) => !error);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    submitForm,
  };
}

// Helper function to create a form field
function createField<T>(
  initialValue: T,
  options: {
    validate?: (value: T) => string | undefined;
    touched?: boolean;
    error?: string;
  } = {}
): FormField<T> {
  return {
    value: initialValue,
    error: options.error,
    touched: options.touched || false,
  };
}

// Helper function to create a form validation schema from Zod schema
export function createValidationSchema<T extends z.ZodTypeAny>(
  schema: T
): (value: z.infer<T>) => string | undefined {
  return (value: z.infer<T>) => {
    const result = schema.safeParse(value);
    return result.success ? undefined : result.error.errors[0].message;
  };
}

// Export types
export type { FormField, FormState, FormValidationSchema, SubmitHandler };
