"use client";

import { useState /*, useRef */ } from "react";
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
  onSubmit: (form: Record<string, string>) => Promise<void>;
};

const formSchema = z.object({
  email: z.string().email({ message: "Email must be a valid address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  is_private: z.enum(["true", "false"], { message: "Privacy setting is required." }),
});

export default function AuthForm({ title, fields, onSubmit }: Props) {
  const [form, setForm] = useState<Record<string, string>>({
    is_private: "false",
  });
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  // const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);

    const sanitizedForm: Record<string, string> = {};
    for (const key in form) {
      sanitizedForm[key] = DOMPurify.sanitize(form[key]);
    }

    const result = formSchema.safeParse(sanitizedForm);
    if (!result.success) {
      const messages = result.error.errors.map((err) => {
        const label = fields.find((f) => f.name === err.path[0])?.label || err.path[0];
        return `${label}: ${err.message}`;
      });
      setErrorMessages(messages);
      return;
    }

    // CAPTCHA (optional)
    /*
    const captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      setErrorMessages(["Please complete the CAPTCHA."]);
      return;
    }
    sanitizedForm["captcha"] = captchaToken;
    */

    try {
      await onSubmit(sanitizedForm);
    } catch (err) {
      // Always show generic login error
      setErrorMessages(["Invalid email or password."]);
    }
    
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                  checked={form[f.name] === "false"}
                  onChange={handleChange}
                  required={f.required}
                />
                Public
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="radio"
                  name={f.name}
                  value="true"
                  checked={form[f.name] === "true"}
                  onChange={handleChange}
                  required={f.required}
                />
                Private
              </label>
            </div>
          ) : (
            <input
              type={f.type}
              name={f.name}
              required={f.required ?? false}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
            />
          )}
        </div>
      ))}

      {/* Uncomment when reCAPTCHA is configured */}
      {/* <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      /> */}

      {errorMessages.length > 0 && (
        <ul className="text-sm text-red-500 space-y-1 text-left">
          {errorMessages.map((msg, idx) => (
            <li key={idx}>• {msg}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
      >
        Submit
      </button>
    </form>
  );
}
