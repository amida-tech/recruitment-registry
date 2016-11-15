import * as actionTypes from './actionTypes';

export function getConsentDocs() {
  return {
    type: actionTypes.GET_CONSENT_DOCS
  }
}

export function getConsentDocsFailure(error) {
  return {
    type: actionTypes.GET_CONSENT_DOCS_FAILURE,
    payload: {
      error
    }
  }
}

export function getConsentDocsSuccess(docs) {
  return {
    type: actionTypes.GET_CONSENT_DOCS_SUCCESS,
    payload: {
      docs
    }
  }
}

export function signConsent(consentDocumentId) {
  return {
    type: actionTypes.SIGN_CONSENT,
    payload: {
      consentDocumentId
    }
  }
}

export function signConsentFailure(error) {
  return {
    type: actionTypes.SIGN_CONSENT_FAILURE,
    payload: {
      error
    }
  }
}

export function signConsentSuccess() {
  return {
    type: actionTypes.SIGN_CONSENT_SUCCESS
  }
}
