import axios from "axios";

// This file contains the axios instance used for making API requests.
// It is configured to include credentials (cookies) in requests.
// This is important for authentication, especially when using JWTs stored in cookies.
// The base URL is set to "/api", which is the endpoint for the backend API.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // include cookies (JWT)
});

export default api;
