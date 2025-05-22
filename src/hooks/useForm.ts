"use client";

import { useState, ChangeEvent, FormEvent } from "react";

interface FormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Record<string, string>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: FormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle input change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle checkboxes
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setValues({
        ...values,
        [name]: checkbox.checked,
      });
    } else {
      setValues({
        ...values,
        [name]: value,
      });
    }
  };

  // Handle field blur
  const handleBlur = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });

    // Validate on blur if validation function exists
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // Validate if validation function exists
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);

      // Return if there are errors
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to initial values
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  // Set a single field value
  const setFieldValue = (name: string, value: any) => {
    setValues({
      ...values,
      [name]: value,
    });
  };

  // Set a single field error
  const setFieldError = (name: string, error: string) => {
    setErrors({
      ...errors,
      [name]: error,
    });
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
  };
};
