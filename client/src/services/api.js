import getFullPath from '../utils/getFullPath';
import 'whatwg-fetch';

const apiService = {
  getUserConsentDocsByType: (typeName, callback) => {
    const path = getFullPath(`/user-consent-documents/type-name/${typeName}`);
    return apiGetRequest(path, callback);
  },
  postConsent: (requestBody, callback) => {
    const path = getFullPath('/consent-signatures');
    return apiPostRequest(path, requestBody, callback);
  }
}

/**
 * Executes a GET request on the given URI
 * @param {String} fullURI
 * @param {Function} callback
 * @return {Any} handled by callback. Generally the response data.
**/
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

/**
 * Executes a POST request on the given URI
 * @param {String} fullURI
 * @param {Object} requestBody
 * @param {Function} callback
 * @return {Any} handled by callback.
**/
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
