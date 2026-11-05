const getRequest = require("../helpers/getRequest.js");
const postRequest = require("../helpers/postRequest.js");
const { describe, expect, it } = require("@jest/globals");

describe("GET végpontok", () => {
    it("GET /api - sikeresen betölti a weboldalt", async () => {
        const response = await getRequest("/api");

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/text\/html/);
    });

    it("GET /api/frontend-termekek - öt feltöltött terméket ad vissza", async () => {
        const response = await getRequest("/api/frontend-termekek");

        expect(response.status).toBe(200);
        expect(response.body.termekek).toHaveLength(5);
    });

    it("POST /api/auth/logout - sikeresen kijelentkeztet", async () => {
        const response = await postRequest("/api/auth/logout");

        expect(response.body.msg).toBe("Sikeresen kijelentkeztél!");
    });
});