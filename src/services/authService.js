import api from './api';

export async function register({ username, email, password }) {
  const { data } = await api.post('/api/auth/register', { username, email, password });
  return data;
}

export async function login({ usernameOrEmail, password }) {
  const { data } = await api.post('/api/auth/login', { usernameOrEmail, password });
  return data;
}

export async function logout() {
  const { data } = await api.post('/api/auth/logout');
  return data;
}

// Called on app startup (spec §20). Resolves to the user on 200,
// throws with status 401 when the visitor is a guest.
export async function me() {
  const { data } = await api.get('/api/auth/me');
  return data;
}
