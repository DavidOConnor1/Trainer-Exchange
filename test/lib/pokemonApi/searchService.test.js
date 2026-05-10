import {
  searchCards,
  extractCards,
  extractPagination,
  getCardImage,
  formatPrice,
} from "../../../lib/pokemonApi/searchService";
import { pokemonApi } from "../../../lib/pokemonApi/client";

jest.mock("../../../lib/pokemonApi/client", () => ({
  pokemonApi: {
    get: jest.fn(),
  },
}));

describe("searchService", () => {
  beforeEach(() => {
    pokemonApi.get.mockClear();
  });

  describe("searchCards()", () => {
    it("should call pokemonApi.get with correct params", async () => {
      pokemonApi.get.mockResolvedValue({ data: [] });
      await searchCards({
        name: "pikachu",
        page: 2,
        pageSize: 10,
        types: ["Lightning"],
      });
      expect(pokemonApi.get).toHaveBeenCalledWith("/api/search", {
        page: 2,
        pageSize: 10,
        sortBy: "localId",
        sortOrder: "ASC",
        name: "pikachu",
        types: ["Lightning"],
      });
    });

    it("should handle exactName flag", async () => {
      pokemonApi.get.mockResolvedValue({ data: [] });
      await searchCards({ name: "Zard", exactName: true });
      expect(pokemonApi.get).toHaveBeenCalledWith(
        "/api/search",
        expect.objectContaining({
          exactName: true,
        }),
      );
    });

    it("should filter empty/optional params", async () => {
      pokemonApi.get.mockResolvedValue({ data: [] });
      await searchCards({});
      const params = pokemonApi.get.mock.calls[0][1];
      expect(params).not.toHaveProperty("name");
      expect(params).not.toHaveProperty("set");
      expect(params).not.toHaveProperty("types");
    });
  });

  describe("extractCards()", () => {
    it("should return empty array for falsy response", () => {
      expect(extractCards(null)).toEqual([]);
      expect(extractCards(undefined)).toEqual([]);
    });

    it("should return response.data if array", () => {
      const resp = { data: [{ id: 1 }] };
      expect(extractCards(resp)).toEqual([{ id: 1 }]);
    });

    it("should return response if it is an array directly", () => {
      const resp = [{ id: 1 }];
      expect(extractCards(resp)).toEqual([{ id: 1 }]);
    });
  });

  describe("extractPagination()", () => {
    it("should return default values for falsy response", () => {
      expect(extractPagination(null)).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
      });
    });

    it("should extract from nested pagination object", () => {
      const resp = {
        pagination: { page: 2, pageSize: 10, total: 100, hasMore: true },
      };
      expect(extractPagination(resp)).toEqual({
        page: 2,
        pageSize: 10,
        total: 100,
        hasMore: true,
      });
    });

    it("should fallback to top-level fields", () => {
      const resp = { page: 3, pageSize: 30, total: 150, hasMore: false };
      expect(extractPagination(resp)).toEqual({
        page: 3,
        pageSize: 30,
        total: 150,
        hasMore: false,
      });
    });
  });

  describe("getCardImage()", () => {
    it("should return null for missing images", () => {
      expect(getCardImage({})).toBeNull();
      expect(getCardImage(null)).toBeNull();
    });

    it("should return the small image URL when size is small and valid", () => {
      const card = {
        images: {
          small: "https://img.com/small.png",
          large: "https://img.com/large.png",
        },
      };
      expect(getCardImage(card, "small")).toBe("https://img.com/small.png");
    });

    it("should return large image by default", () => {
      const card = { images: { large: "https://img.com/large.png" } };
      expect(getCardImage(card, "large")).toBe("https://img.com/large.png");
    });

    it("should reject non-https URLs", () => {
      const card = { images: { large: "http://img.com/large.png" } };
      expect(getCardImage(card, "large")).toBeNull();
    });

    it("should reject invalid strings", () => {
      const card = { images: { large: "undefined" } };
      expect(getCardImage(card, "large")).toBeNull();
    });
  });

  describe("formatPrice()", () => {
    it("should format a number to two decimal places", () => {
      expect(formatPrice(3.5)).toBe("3.50");
    });

    it('should return "0.00" for null/undefined/NaN', () => {
      expect(formatPrice(null)).toBe("0.00");
      expect(formatPrice(undefined)).toBe("0.00");
      expect(formatPrice(NaN)).toBe("0.00");
    });
  });
});
