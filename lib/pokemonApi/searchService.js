import { pokemonApi } from "./client";

export async function searchCards(criteria = {}, options = {}) {
  const {
    name = "",
    exactName = false,
    types = [],
    set = "",
    rarity = "",
    minHp = null,
    maxHp = null,
    localId = "",
    sortBy = "localId",
    sortOrder = "ASC",
    page = 1,
    pageSize = 20,
  } = criteria;

  const params = { page, pageSize, sortBy, sortOrder };
  if (name) params.name = name;
  if (exactName) params.exactName = true;
  if (types.length > 0) params.types = types;
  if (set) params.set = set;
  if (rarity) params.rarity = rarity;
  if (minHp !== null) params.minHp = minHp;
  if (maxHp !== null) params.maxHp = maxHp;
  if (localId) params.localId = localId;

  return pokemonApi.get("/api/search", params);
}

export function extractCards(response) {
  if (!response) return [];
  if (response.data && Array.isArray(response.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

export function extractPagination(response) {
  if (!response) return { page: 1, pageSize: 20, total: 0, hasMore: false };

  // Check for nested pagination object
  if (response.pagination) {
    return {
      page: response.pagination.page || 1,
      pageSize: response.pagination.pageSize || 20,
      total: response.pagination.total || 0,
      hasMore: response.pagination.hasMore || false,
    };
  }

  // Fallback to top-level
  return {
    page: response.page || 1,
    pageSize: response.pageSize || 20,
    total: response.total || 0,
    hasMore: response.hasMore || false,
  };
}

export function getCardImage(card, size = "large") {
  if (!card?.images) return null;
  const url = size === "small" ? card.images.small : card.images.large;
  if (url && typeof url === "string" && url.startsWith("https://")) return url;
  return null;
}

export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return "0.00";
  return Number(price).toFixed(2);
}
