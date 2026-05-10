// test/lib/pokemonApi/client.test.js
import { pokemonApi } from "../../../lib/pokemonApi/client";

global.fetch = jest.fn();

jest.mock("../../../lib/supabase/api", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

const { supabase } = require("../../../lib/supabase/api");

describe("PokemonApiClient", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetch.mockReset();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
    supabase.auth.refreshSession.mockResolvedValue({
      data: { session: { access_token: "new-token" } },
      error: null,
    });
  });

  // Singleton – test that the imported pokemonApi is an object
  it("should be a single instance", () => {
    expect(pokemonApi).toBeDefined();
    expect(pokemonApi).toBeTruthy();
    // The class is not exported, so we can't test 'new', but the instance is always the same
  });

  describe("get()", () => {
    it("should build a GET request with query parameters", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
        headers: new Map(),
      });

      await pokemonApi.get("/test", { foo: "bar", baz: 123 });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/test\?foo=bar&baz=123/),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should omit null/undefined/empty params", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
        headers: new Map(),
      });

      await pokemonApi.get("/test", { a: null, b: undefined, c: "" });
      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).not.toContain("a=");
      expect(calledUrl).not.toContain("b=");
      expect(calledUrl).not.toContain("c=");
    });

    it("should handle array params (append multiple)", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
        headers: new Map(),
      });

      await pokemonApi.get("/test", { types: ["Fire", "Water"] });
      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain("types=Fire");
      expect(calledUrl).toContain("types=Water");
    });
  });

  describe("searchCards()", () => {
    it("should call get with correct query params", async () => {
      const spy = jest.spyOn(pokemonApi, "get").mockResolvedValue({ data: [] });
      await pokemonApi.searchCards({ name: "pikachu", page: 2, pageSize: 10 });
      expect(spy).toHaveBeenCalledWith(
        "/api/search",
        expect.objectContaining({
          name: "pikachu",
          page: 2,
          pageSize: 10,
        }),
      );
      spy.mockRestore();
    });
  });

  describe("request()", () => {
    it("should attach auth token header", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Map(),
      });

      await pokemonApi.request("/test");
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should throw on 401", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
        headers: new Map(),
      });
      await expect(pokemonApi.request("/test")).rejects.toThrow(
        "Please sign in to search cards.",
      );
    });

    it("should throw on 429 rate limit", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({}),
        headers: new Map([["Retry-After", "5"]]),
      });
      await expect(pokemonApi.request("/test")).rejects.toThrow(
        "Rate limit exceeded",
      );
    });

    it("should retry on 503 once", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
        headers: new Map(),
      });
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        headers: new Map(),
      });

      const result = await pokemonApi.request("/test");
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it("should throw network error on TypeError", async () => {
      fetch.mockRejectedValueOnce(new TypeError("fetch failed"));
      await expect(pokemonApi.request("/test")).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("updateRateLimits()", () => {
    it("should update rate limit info from headers", () => {
      const response = {
        headers: new Map([
          ["X-RateLimit-Remaining", "42"],
          ["X-RateLimit-Reset", "1234567890"],
        ]),
        url: "/api/search",
      };
      pokemonApi.updateRateLimits(response);
      const info = pokemonApi.getRateLimitInfo();
      expect(info.searchRemaining).toBe(42);
      expect(info.resetTime).toEqual(new Date(1234567890 * 1000));
    });

    it("should update global remaining for non-search endpoints", () => {
      const response = {
        headers: new Map([["X-RateLimit-Remaining", "88"]]),
        url: "/api/cards",
      };
      pokemonApi.updateRateLimits(response);
      expect(pokemonApi.getRateLimitInfo().globalRemaining).toBe(88);
    });
  });

  describe("getCardById()", () => {
    it("should encode URI and request card", async () => {
      const spy = jest
        .spyOn(pokemonApi, "request")
        .mockResolvedValue({ id: "base1-1" });
      const result = await pokemonApi.getCardById("base1-1");
      expect(spy).toHaveBeenCalledWith("/api/cards/base1-1");
      expect(result).toEqual({ id: "base1-1" });
      spy.mockRestore();
    });
  });
});
