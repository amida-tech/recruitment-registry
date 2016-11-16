import getFullPath from '../utils/getFullPath';
import 'whatwg-fetch';

const apiService = {
  getUserConsentDocs: (typeName, callback) => {
    const relativePath = `/users/me`;
    return apiGetRequest(getFullPath(relativePath, callback));
  }
}

function apiGetRequest(fullURI, callback) {
  return (callback) => {
      fetch(fullURI, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      }
    })
    .then(res => {
      res.json()
      .then(callback);
    });
  }
}


export default apiService;
