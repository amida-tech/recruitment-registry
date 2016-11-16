import getFullPath from '../utils/getFullPath';
import 'whatwg-fetch';

const apiService = {
  getUserConsentDocs: (typeName, callback) => {
    const path = getFullPath('/users/me');
    return apiGetRequest(path, callback);
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
    res.json().then(data => callback(data));
  });
}

function apiPostRequest(fullURI, requestBody, callback) {
  fetch(fullURI, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token'
    },
    body: JSON.stringify(requestBody)
  })
  .then(res => {
    res.json().then(data => callback(data));
  });
}

export default apiService;
