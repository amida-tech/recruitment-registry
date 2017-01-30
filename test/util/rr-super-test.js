'use strict';

const path = require('path');

const session = require('supertest-session');
const _ = require('lodash');

module.exports = class RRSupertest {
    constructor() {
        this.server = null;
        this.baseUrl = '/api/v1.0';
    }

    initialize(app) {
        this.app = app;
        this.server = session(app);
    }

    authBasic(credentials, status = 200) {
        return this.server
            .get(this.baseUrl + '/auth/basic')
            .auth(credentials.username, credentials.password)
            .expect(status);
    }

    resetAuth() {
        this.server = session(this.app);
    }

    getJWT() {
        const jwt = _.find(this.server.cookies, function (cookie) {
            return cookie.name === 'rr-jwt-token';
        });
        return jwt;
    }

    update(operation, resource, payload, status, header) {
        let r = this.server[operation](this.baseUrl + resource);
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    post(resource, payload, status, header) {
        return this.update('post', resource, payload, status, header);
    }

    postFile(resource, field, filepath, payload, status) {
        const filename = path.basename(filepath);
        const request = this.server
            .post(this.baseUrl + resource)
            .attach(field, filepath, filename);
        if (payload) {
            return request.field(payload).expect(status);
        } else {
            return request.expect(status);
        }
    }

    patch(resource, payload, status, header) {
        return this.update('patch', resource, payload, status, header);
    }

    authPost(resource, payload, status, header) {
        return this.update('post', resource, payload, status, header).expect(status);
    }

    delete(resource, status, query) {
        let r = this.server.delete(this.baseUrl + resource);
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }

    get(resource, auth, status, query) {
        let r = this.server.get(this.baseUrl + resource);
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }
};
