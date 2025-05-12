"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/services/axios";
import ProfileFormFields from "@/components/profile/ProfileFormFields";

export default function EditProfilePage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    nickname: "",
    about: "",
    is_private: "false",
    dob: "",
  });
  //   const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        nickname: user.nickname || "",
        about: user.about || "",
        is_private: user.is_private ? "true" : "false",
        dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
      });
    }
  }, [user]);

  if (loading) {
    return <p className="p-6 text-center text-gray-500">Loading...</p>;
  }
  if (!user) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedDOB = new Date(form.dob).toISOString().split("T")[0];

    try {
      await api.post("/profile/edit", {
        ...form,
        dob: normalizedDOB,
        is_private: form.is_private === "true",
      });
      const res = await api.get("/me");
      setUser(res.data);
      router.push(`/profile/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data || "Update failed");
    }
  };

  return (
    <main className="flex justify-center px-4 py-10 bg-gray-50 min-h-screen">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md border border-gray-200 p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-blue-600 text-center">
          Edit Your Profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProfileFormFields form={form} handleChange={handleChange} />
          {/* <AvatarUploader avatar={avatar} currentUrl={user.avatar} onChange={handleAvatarChange} /> */}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
