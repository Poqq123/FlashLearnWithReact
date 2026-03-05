import { API_URL, TOKEN_STORAGE_KEY } from "../config";

function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("You must be logged in.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `Request failed with ${response.status}`;
    throw new Error(detail);
  }

  return payload;
}

export function getCollections() {
  return request("/collections", { method: "GET" });
}

export function createCollection(data) {
  return request("/collections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCollection(collectionId, data) {
  return request(`/collections/${collectionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCollection(collectionId) {
  return request(`/collections/${collectionId}`, {
    method: "DELETE",
  });
}

export function getCards(collectionId = null) {
  const query = collectionId ? `?collection_id=${collectionId}` : "";
  return request(`/cards${query}`, { method: "GET" });
}

export function createCard(data) {
  return request("/cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCard(cardId, data) {
  return request(`/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCard(cardId) {
  return request(`/cards/${cardId}`, {
    method: "DELETE",
  });
}

export function reviewCard(cardId, rating) {
  return request(`/cards/${cardId}/review`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

export function resetProgress(collectionId = null) {
  return request("/cards/reset-progress", {
    method: "POST",
    body: JSON.stringify({ collection_id: collectionId }),
  });
}
