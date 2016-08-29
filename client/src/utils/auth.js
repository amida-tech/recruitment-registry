import request from './fakeRequest';

var auth = {
  login(username, password, callback) {
    if (this.loggedIn()) {
      callback(true);
      return;
    }
    request.post('/api/v1.0/user/token', { username, password }, (response) => {
      if (response.authenticated) {
        localStorage.token = response.token;
        callback(true);
      } else {
        callback(false, response.error);
      }
    });
  },

  logout(callback) {
    request.post('/api/v1.0/user/logout', {}, () => {
      callback(true);
    });
  },

  loggedIn() {
    return !!localStorage.token;
  },

  register(username, password, callback) {
    request.post('/api/v1.0/user/register', { username, password }, (response) => {
      if (response.registered === true) {
        this.login(username, password, callback);
      } else {
        callback(false, response.error);
      }
    });
  },

  onChange() {}
}

module.exports = auth;