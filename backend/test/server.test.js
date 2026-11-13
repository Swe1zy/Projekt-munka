const getRequest = require("../helpers/getRequest.js");
const postRequest = require("../helpers/postRequest.js");
const request = require("supertest");
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

describe("Regisztráció", () => {
    it("POST /api/auth/register - az ÁSZF elfogadása nélkül 400-at ad", async () => {
        const response = await request("http://localhost:3600")
            .post("/api/auth/register")
            .send({ nev: "Teszt Elek", email: "aszf-nelkul@example.com", jelszo: "titkosjelszo" });

        expect(response.status).toBe(400);
        expect(response.body.msg).toMatch(/Általános Szerződési Feltételeket/);
    });

    it("GET /api/beallitasok - visszaadja az ÁSZF verzióját és az eladó adatait", async () => {
        const response = await request("http://localhost:3600").get("/api/beallitasok");

        expect(response.body.aszf.verzio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(response.body.aszf.elado.nev).toBeTruthy();
        expect(response.body.aszf.elado.bankszamla).toBeUndefined();
    });
});

describe("Dashboard végpont", () => {
    it("GET /api/dashboard - bejelentkezés nélkül nem adja ki az adatokat", async () => {
        const response = await request("http://localhost:3600").get("/api/dashboard");

        expect(response.status).toBe(401);
        expect(response.body.osszegzes).toBeUndefined();
    });
});

describe("Rendelés végpontok jogosultsága", () => {
    it("GET /api/rendelesek/sajat - bejelentkezés nélkül 401-et ad", async () => {
        const response = await request("http://localhost:3600").get("/api/rendelesek/sajat");

        expect(response.status).toBe(401);
    });

    it("GET /api/admin/rendelesek - bejelentkezés nélkül 401-et ad", async () => {
        const response = await request("http://localhost:3600").get("/api/admin/rendelesek");

        expect(response.status).toBe(401);
    });

    it("PATCH /api/admin/rendelesek/:id/allapot - bejelentkezés nélkül nem módosít", async () => {
        const response = await request("http://localhost:3600")
            .patch("/api/admin/rendelesek/000000000000000000000000/allapot")
            .send({ allapot: "lemondva" });

        expect(response.status).toBe(401);
    });
});


describe("Szállítás, beállítások, árajánlat", () => {
    it("GET /api/beallitasok - visszaadja a telephelyet és a választható napokat", async () => {
        const response = await request("http://localhost:3600").get("/api/beallitasok");

        expect(response.status).toBe(200);
        expect(response.body.telephely.cim).toBeTruthy();
        expect(Array.isArray(response.body.valaszthatoNapok.hazhozszallitas)).toBe(true);
    });

    it("POST /api/rendelesek/osszesito - üres kosárra 400-at ad", async () => {
        const response = await request("http://localhost:3600")
            .post("/api/rendelesek/osszesito")
            .send({ tetelek: [] });

        expect(response.status).toBe(400);
    });

    it("GET /api/admin/arajanlatok - bejelentkezés nélkül 401-et ad", async () => {
        const response = await request("http://localhost:3600").get("/api/admin/arajanlatok");

        expect(response.status).toBe(401);
    });
});

describe("Díjbekérő és export jogosultsága", () => {
    it("GET /api/rendelesek/:id/dijbekero - bejelentkezés nélkül 401-et ad", async () => {
        const response = await request("http://localhost:3600").get("/api/rendelesek/000000000000000000000000/dijbekero");

        expect(response.status).toBe(401);
    });

    it("GET /api/dashboard/export - bejelentkezés nélkül 401-et ad", async () => {
        const response = await request("http://localhost:3600").get("/api/dashboard/export?tipus=keszlet");

        expect(response.status).toBe(401);
    });
});
