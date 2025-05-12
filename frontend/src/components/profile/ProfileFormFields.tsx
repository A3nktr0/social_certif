"use client";
import React from "react";
import DOMPurify from "dompurify";

type Props = {
  form: Record<string, string>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

// Sanitizes display values (just for rendering safety, actual sanitization should happen before saving backend-side)
const sanitize = (value: string) => DOMPurify.sanitize(value);

export default function ProfileFormFields({ form, handleChange }: Props) {
  return (
    <>
      {[
        { label: "First Name", name: "first_name", required: true },
        { label: "Last Name", name: "last_name", required: true },
        { label: "Nickname", name: "nickname", required: true },
      ].map(({ label, name, required }) => (
        <div key={name} className="mb-4">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            id={name}
            name={name}
            required={required}
            value={sanitize(form[name] || "")}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      <div className="mb-4">
        <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">
          About
        </label>
        <textarea
          id="about"
          name="about"
          rows={3}
          value={sanitize(form.about || "")}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth
        </label>
        <input
          type="date"
          id="dob"
          name="dob"
          required
          max={new Date().toISOString().split("T")[0]}
          value={form.dob}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Visibility
        </label>
        <div className="flex gap-6 mt-2">
          {[
            { value: "false", label: "Public" },
            { value: "true", label: "Private" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name="is_private"
                value={value}
                checked={form.is_private === value}
                onChange={handleChange}
                className="accent-blue-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
