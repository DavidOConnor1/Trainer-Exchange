// test/lib/supabase/api.test.js
jest.unmock("@/lib/supabase/api");
import {
  checkHealth,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  supabase,
} from "../../../lib/supabase/api";

global.fetch = jest.fn();

describe("Supabase API", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe("apiRequest()", () => {
    it("should make a GET request and return JSON", async () => {
      const mockData = { id: 1, name: "Test" };
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => mockData,
      });

      const result = await checkHealth();
      expect(fetch).toHaveBeenCalledWith(
        "https://test-api.example.com/health",
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result).toEqual(mockData);
    });

    it("should return null for non-json response", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "text/plain"]]),
        text: async () => "OK",
      });
      const result = await checkHealth();
      expect(result).toBeNull();
    });

    it("should throw on non-ok response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({}),
      });
      await expect(checkHealth()).rejects.toThrow("API Error: 404");
    });

    it("should handle network errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));
      await expect(checkHealth()).rejects.toThrow("Network error");
    });

    it("should stringify body if it is an object", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({ id: 2 }),
      });
      await createUser({ name: "John" });
      const [, options] = fetch.mock.calls[0];
      expect(options.body).toBe(JSON.stringify({ name: "John" }));
    });
  });

  describe("CRUD helpers", () => {
    it("getUsers should call /users", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => [],
      });
      await getUsers();
      expect(fetch).toHaveBeenCalledWith(
        "https://test-api.example.com/users",
        expect.anything(),
      );
    });

    it("createUser should POST to /users", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({ id: 3 }),
      });
      await createUser({ email: "test@test.com" });
      expect(fetch).toHaveBeenCalledWith(
        "https://test-api.example.com/users",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("updateUser should PUT to /users/:id", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({ id: 4 }),
      });
      await updateUser(4, { name: "Jane" });
      expect(fetch).toHaveBeenCalledWith(
        "https://test-api.example.com/users/4",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("deleteUser should DELETE /users/:id", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: async () => ({}),
      });
      await deleteUser(5);
      expect(fetch).toHaveBeenCalledWith(
        "https://test-api.example.com/users/5",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("Supabase client", () => {
    it("should create a Supabase client", () => {
      expect(supabase).toBeDefined();
    });
  });
});
