import { CHANGE_FORM, SENDING_REQUEST } from './constants';
import {SET_AUTH} from "./constants";
import { browserHistory } from 'react-router';

export function changeForm(newState) {
  return { type: CHANGE_FORM, newState };
}

export function sendingRequest(sending) {
  return { type: SENDING_REQUEST, sending };
}

export function removeLastFormError() {
  const form = document.querySelector('.form-page__form-wrapper');
  form.classList.remove('js-form__err--' + lastErrType);
}

export function anyElementsEmpty(elements) {
  for (let element in elements) {
    if (!elements[element]) {
      return true;
    }
  }
  return false;
}

let lastErrType = "";

export function requestFailed(err) {
  removeLastFormError();
  const form = document.querySelector('.form-page__form-wrapper');
  form.classList.add('js-form__err');
  form.classList.add('js-form__err-animation');
  form.classList.add('js-form__err--' + err.type);
  lastErrType = err.type;
  setTimeout(() => {
    form.classList.remove('js-form__err-animation');
  }, 150);
}

export function setAuthState(newState) {
  return { type: SET_AUTH, newState };
}

export function forwardTo(location) {
  console.log('forwardTo(' + location + ')');
  browserHistory.push(location);
}
