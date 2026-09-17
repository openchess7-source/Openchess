import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL,
  withCredentials: true, // cookie auth — never send/store a JWT manually
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token, cached in memory. NOT read from document.cookie — on a
// cross-origin deployment (frontend on Vercel, API on Render), the
// backend's cookie belongs to the backend's domain and is invisible to
// the frontend page's document.cookie entirely. The backend exposes the
// same token via a response body instead (GET /api/csrf-token); we fetch
// it once and cache it here, then attach it to every mutating request.
let csrfToken = null;
let csrfFetchPromise = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfFetchPromise) {
    csrfFetchPromise = api.get('/api/csrf-token').then((res) => {
      csrfToken = res.data.csrfToken;
      return csrfToken;
    });
  }
  return csrfFetchPromise;
}

api.interceptors.request.use(async (config) => {
  if (config.method && config.method.toUpperCase() !== 'GET' && !config._skipCsrf) {
    config.headers['X-CSRF-Token'] = await getCsrfToken();
  }
  return config;
});

// If a request gets rejected for a stale/missing CSRF token, refetch the
// token once and retry — handles the case where the in-memory token was
// cached before the server rotated it (e.g. after a long idle period).
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 403 && err.response?.data?.message?.includes('CSRF') && !original._csrfRetried) {
      original._csrfRetried = true;
      csrfToken = null;
      csrfFetchPromise = null;
      original.headers['X-CSRF-Token'] = await getCsrfToken();
      return api.request(original);
    }
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject({ status, message, raw: err });
  }
);

export default api;
