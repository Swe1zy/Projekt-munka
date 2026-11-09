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

    it("GET /api/frontend-termekek/:id - egy terméket ad vissza azonosító alapján", async () => {
        const lista = await getRequest("/api/frontend-termekek");
        const elso = lista.body.termekek[0];
        const response = await getRequest(`/api/frontend-termekek/${elso._id}`);

        expect(response.status).toBe(200);
        expect(response.body.termek._id).toBe(elso._id);
        expect(response.body.termek.nev).toBe(elso.nev);
    });

    it("POST /api/auth/logout - sikeresen kijelentkeztet", async () => {
        const response = await postRequest("/api/auth/logout");

        expect(response.body.msg).toBe("Sikeresen kijelentkeztél!");
    });
});