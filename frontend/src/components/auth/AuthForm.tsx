"use client";

import { useState } from "react";

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

export default function AuthForm({ title, fields, onSubmit }: Props) {
  const [form, setForm] = useState<Record<string, string>>({
    is_private: "false",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const cleanForm = Object.fromEntries(
        Object.entries(form).filter(([key]) =>
          fields.some((f) => f.name === key)
        )
      );
      await onSubmit(cleanForm);
    } catch (err) {
      setError((err as Error).message);
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
              // className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleChange}
            />
          )}
        </div>
      ))}

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
