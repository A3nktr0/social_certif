import api from "@/lib/services/axios"; // your configured axios instance

export async function postJSON<T, D = Record<string, unknown>>(url: string, data: D): Promise<T> {
  try {
    const res = await api.post<T>(url, data);
    return res.data;
  } catch (err: unknown) {
    const errorObj = err as { 
      response?: { data?: string },
      message?: string 
    };
    const message =
      errorObj?.response?.data || errorObj?.message || "Request failed";
    throw new Error(message);
  }
}
