export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  };
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}
