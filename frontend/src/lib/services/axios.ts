import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // include cookies (JWT)
});

export default api;
