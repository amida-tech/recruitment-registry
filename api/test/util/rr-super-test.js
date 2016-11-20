'use strict';

const _ = require('lodash');

module.exports = class RRSupertest {
    constructor() {
        this.server = null;
        this.auth = null;
        this.baseUrl = '/api/v1.0';
    }

    initialize(server) {
        this.server = server;
    }

    post(resource, payload, status, header) {
        const endpoint = this.baseUrl + resource;
        const token = this.auth;
        let r = this.server.post(endpoint);
        r = r.set('Cookie', `rr-jwt-token=${token}`);
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    patch(resource, payload, status, header) {
        const endpoint = this.baseUrl + resource;
        const token = this.auth;
        let r = this.server.patch(endpoint);
        r = r.set('Cookie', `rr-jwt-token=${token}`);
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    delete(resource, status) {
        const endpoint = this.baseUrl + resource;
        const token = this.auth;
        return this.server.delete(endpoint)
            .set('Cookie', `rr-jwt-token=${token}`)
            .expect(status);
    }

    get(resource, auth, status, query) {
        const endpoint = this.baseUrl + resource;
        let r = this.server.get(endpoint);
        if (auth) {
            const token = (typeof auth === 'string') ? auth : this.auth;
            r = r.set('Cookie', `rr-jwt-token=${token}`);
        }
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }
};
