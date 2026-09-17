import api from './api';

export async function getGame(id) {
  const { data } = await api.get(`/api/games/${id}`);
  return data;
}
