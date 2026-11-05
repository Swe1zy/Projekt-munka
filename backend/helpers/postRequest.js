const request = require("supertest");

const baseURL = "http://localhost:3600";

async function postRequest(path, data = {}) {
    return request(baseURL)
        .post(path)
        .set("Accept", "application/json")
        .send(data)
        .expect(200);
}

module.exports = postRequest;
