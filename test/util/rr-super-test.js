'use strict';

const path = require('path');

const _ = require('lodash');

module.exports = class RRSupertest {
    constructor() {
        this.server = null;
        this.jwt = null;
        this.baseUrl = '/api/v1.0';
    }

    initialize(server) {
        this.server = server;
    }

    updateJWTFromCookie(res) {
        const cookie = _.get(res, 'header.set-cookie.0');
        if (cookie) {
            const token = cookie.split(';')[0].split('=')[1];
            if (token) {
                this.jwt = token;
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
                    this.updateJWTFromCookie(res);
                }
            });
    }

    resetAuth() {
        this.jwt = null;
    }

    update(operation, resource, payload, status, header) {
        let r = this.server[operation](this.baseUrl + resource);
        r = r.set('Cookie', `rr-jwt-token=${this.jwt}`);
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
            .set('Cookie', `rr-jwt-token=${this.jwt}`)
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
        return this.update('post', resource, payload, status, header)
            .expect(res => {
                if (status < 400) {
                    this.updateJWTFromCookie(res);
                }
            });
    }

    delete(resource, status, query) {
        let r = this.server.delete(this.baseUrl + resource);
        if (query) {
            r = r.query(query);
        }
        return r.set('Cookie', `rr-jwt-token=${this.jwt}`).expect(status);
    }

    get(resource, auth, status, query) {
        let r = this.server.get(this.baseUrl + resource);
        if (auth) {
            const token = (typeof auth === 'string') ? auth : this.jwt;
            r = r.set('Cookie', `rr-jwt-token=${token}`);
        }
        if (query) {
            r = r.query(query);
        }
        return r.expect(status);
    }
};