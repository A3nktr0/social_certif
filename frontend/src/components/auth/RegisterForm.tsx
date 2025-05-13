"use client";

import { useState, useRef } from "react";
import DOMPurify from "dompurify";
import { z } from "zod";
// import ReCAPTCHA from "react-google-recaptcha";

type Field = {
  name: string;
  type: string;
  label: string;
  required?: boolean;
};

type Props = {
  title: string;
  fields: Field[];
  onSubmit: (form: FormData) => Promise<void>;
};

// Define your schema (you can make this dynamic later)
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // Add more fields based on your form config
});

export default function RegisterForm({ title, fields, onSubmit }: Props) {
  const [error, setError] = useState("");
  // const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const formValues: Record<string, string> = {};

    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        formValues[key] = DOMPurify.sanitize(value);
      }
    }

    // Client-side validation
    const validation = formSchema.safeParse(formValues);
    if (!validation.success) {
      setError("Validation failed: " + validation.error.errors[0]?.message);
      return;
    }

    // // CAPTCHA validation
    // const captchaToken = recaptchaRef.current?.getValue();
    // if (!captchaToken) {
    //   setError("Please complete the CAPTCHA.");
    //   return;
    // }
    // form.append("captcha", captchaToken);

    try {
      await onSubmit(form);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      // recaptchaRef.current?.reset();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-4"
    >
      {title && <h2 className="text-xl font-semibold text-center">{title}</h2>}

      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <label htmlFor={f.name} className="block text-sm font-medium text-gray-700">
            {f.label}
          </label>

          {f.type === "radio" ? (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="radio"
                  name={f.name}
                  value="false"
                  defaultChecked
                  required={f.required}
                />
                Public
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="radio"
                  name={f.name}
                  value="true"
                  required={f.required}
                />
                Private
              </label>
            </div>
          ) : f.type === "file" ? (
            <input
              type="file"
              name={f.name}
              accept="image/*"
              className="w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 text-sm text-gray-900"
            />
          ) : (
            <input
              type={f.type}
              name={f.name}
              required={f.required ?? false}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      ))}
{/* 
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      /> */}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
      >
        Submit
      </button>
    </form>
  );
}
