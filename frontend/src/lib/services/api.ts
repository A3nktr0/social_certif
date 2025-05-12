import api from "@lib/services/axios"; // your configured axios instance

export async function postJSON<T>(url: string, data: any): Promise<T> {
  try {
    const res = await api.post<T>(url, data);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data || err?.message || "Request failed";
    throw new Error(message);
  }
}
