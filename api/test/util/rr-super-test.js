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

    updateStoreFromCookie(res) {
        const cookie = _.get(res, 'header.set-cookie.0');
        if (cookie) {
            const token = cookie.split(';')[0].split('=')[1];
            if (token) {
                this.auth = token;
            }
        }
    }

    authBasic(credentials, status = 200) {
        return this.server
            .get(this.baseUrl + '/auth/basic')
            .auth(credentials.username, credentials.password)
            .expect(status)
            .expect(res => {
                if (status < 400) {
                    this.updateStoreFromCookie(res);
                }
            });
    }

    resetAuth() {
        this.auth = null;
    }

    update(operation, resource, payload, status, header) {
        const endpoint = this.baseUrl + resource;
        const token = this.auth;
        let r = this.server[operation](endpoint);
        r = r.set('Cookie', `rr-jwt-token=${token}`);
        if (header) {
            _.toPairs(header).forEach(([key, value]) => r.set(key, value));
        }
        return r.send(payload).expect(status);
    }

    post(resource, payload, status, header) {
        return this.update('post', resource, payload, status, header);
    }

    patch(resource, payload, status, header) {
        return this.update('patch', resource, payload, status, header);
    }

    authPost(resource, payload, status, header) {
        return this.update('post', resource, payload, status, header)
            .expect(res => {
                if (status < 400) {
                    this.updateStoreFromCookie(res);
                }
            });
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

    jwt() {
        return this.auth;
    }
};
