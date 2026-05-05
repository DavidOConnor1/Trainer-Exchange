// lib/pokemonApi/client.js
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://trainer-exchange-backend-services-production.up.railway.app/"
).replace(/\/$/, "");

class PokemonApiClient {
  constructor() {
    if (PokemonApiClient.instance) return PokemonApiClient.instance;
    this.baseURL = BACKEND_URL;
    this.rateLimitInfo = {
      globalRemaining: 100,
      searchRemaining: 30,
      resetTime: null,
    };
    PokemonApiClient.instance = this;
  }

  async getAuthToken() {
    try {
      const { supabase } = await import("../supabase/api");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  // ===== ADD THIS METHOD =====
  /**
   * GET request with query parameters
   * @param {string} endpoint - API endpoint (e.g., '/api/search')
   * @param {Object} params - Query parameters as object
   * @returns {Promise}
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams();

    // Build query string from params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          // Handle array params (e.g., types[]=Fire&types[]=Water)
          value.forEach((v) => queryString.append(key, v));
        } else {
          queryString.append(key, value);
        }
      }
    });

    const queryStr = queryString.toString();
    const url = queryStr ? `${endpoint}?${queryStr}` : endpoint;

    return this.request(url);
  }

  /**
   * POST request with JSON body
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise}
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===== UPDATE YOUR EXISTING searchCards METHOD =====
  async searchCards(params = {}) {
    // Now uses the new get() method
    const {
      name,
      type,
      types,
      set,
      rarity,
      hp,
      minHp,
      maxHp,
      exactName,
      page,
      limit,
      pageSize,
      sortBy,
      sortOrder,
    } = params;

    const queryParams = {};

    if (name) queryParams.name = name;
    if (exactName) queryParams.exactName = true;
    if (types && types.length > 0) queryParams.types = types;
    if (type) queryParams.type = type;
    if (set) queryParams.set = set;
    if (rarity) queryParams.rarity = rarity;
    if (hp) queryParams.hp = hp;
    if (minHp !== null && minHp !== undefined) queryParams.minHp = minHp;
    if (maxHp !== null && maxHp !== undefined) queryParams.maxHp = maxHp;
    if (page) queryParams.page = page;
    if (limit) queryParams.limit = limit;
    if (pageSize) queryParams.pageSize = pageSize;
    if (sortBy) queryParams.sortBy = sortBy;
    if (sortOrder) queryParams.sortOrder = sortOrder;

    return this.get("/api/search", queryParams);
  }

  async request(endpoint, options = {}) {
    // Ensure endpoint starts with / but doesn't double up
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${cleanEndpoint}`;

    console.log("🌐 API Request URL:", url); // Debug log

    const token = await this.getAuthToken();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Update rate limit info
      this.updateRateLimits(response);

      // Handle rate limiting
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment.");
      }

      // Handle authentication errors
      if (response.status === 401) {
        throw new Error("Please sign in to search cards.");
      }

      if (response.status === 503 && !options._retried) {
        // Wait 1 second and retry once
        await new Promise((r) => setTimeout(r, 1000));
        return this.request(endpoint, { ...options, _retried: true });
      }

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error ||
            errorData.message ||
            `API Error: ${response.status}`;
        } catch {
          errorMessage = `API Error: ${response.status}`;
        }

        console.error("API Error Response:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  }

  updateRateLimits(response) {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    if (remaining) {
      if (response.url && response.url.includes("search")) {
        this.rateLimitInfo.searchRemaining = parseInt(remaining);
      } else {
        this.rateLimitInfo.globalRemaining = parseInt(remaining);
      }
    }

    if (reset) {
      this.rateLimitInfo.resetTime = new Date(parseInt(reset) * 1000);
    }
  }

  getRateLimitInfo() {
    return { ...this.rateLimitInfo };
  }

  async getCardById(id) {
    return this.request(`/api/cards/${encodeURIComponent(id)}`);
  }

  async getCardByName(name) {
    return this.request(`/api/cards/name/${encodeURIComponent(name)}`);
  }
}

// Helper function to extract cards from various response formats
function extractCardsFromResponse(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.cards && Array.isArray(response.cards)) return response.cards;
  if (response.results && Array.isArray(response.results))
    return response.results;
  if (response.id || response.name) return [response];
  return [];
}

export const pokemonApi = new PokemonApiClient();
