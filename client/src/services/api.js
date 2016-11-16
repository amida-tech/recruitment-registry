import getFullPath from '../utils/getFullPath';
import 'whatwg-fetch';

const apiService = {
  getUserConsentDocs: (typeName, callback) => {
    const relativePath = `/users/me`;
    return apiGetRequest(getFullPath(relativePath), callback);
  }
}

function apiGetRequest(fullURI, callback) {
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
    .then(data => callback(data));
  });
}


export default apiService;
