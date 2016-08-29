import server from './fakeServer';

var fakeRequest = {
  post(endpoint, data, callback) {
    setTimeout(() => {
      switch (endpoint) {
        case '/api/v1.0/user/token':
          server.login(data.username, data.password, callback);
          break;
        case '/api/v1.0/user/register':
          server.register(data.username, data.password, callback);
          break;
        case '/api/v1.0/user/logout':
          server.logout(callback);
          break;
        default:
          break;
      }
    }, (Math.random() * 2000) + 100);
  }
}

module.exports = fakeRequest;