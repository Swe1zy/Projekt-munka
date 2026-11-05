const request = require("supertest");

const baseURL = "http://localhost:3600";

async function getRequest(path) {
    return request(baseURL)
        .get(path)
        .set("Accept", "*/*")
        .expect(200);
}

module.exports = getRequest;