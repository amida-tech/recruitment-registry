import * as t from './actionTypes';

import { browserHistory } from 'react-router';
import auth from '../utils/auth';

export function changeForm(newState) {
  return { type: t.CHANGE_FORM, newState };
}

export function update(name, value) {
  return dispatch => dispatch({
    type: t.CHANGE_FORM,
    name, value
  });
}

export function sendingRequest(sending) {
  return { type: t.SENDING_REQUEST, sending };
}

export function removeLastFormError() {
  const form = document.querySelector('.form-page__form-wrapper');
  form.classList.remove('js-form__err--' + lastErrType);
}

export function anyElementsEmpty(elements) {
  for (let element in elements) {
    if (!elements[element]) {
      console.log(element);
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
  return { type: t.SET_AUTH, newState };
}

export function forwardTo(location) {
  console.log('forwardTo(' + location + ')');
  browserHistory.push(location);
}

export function register(data) {
  return (dispatch) => {
    dispatch(sendingRequest(true));

    removeLastFormError();

    if (anyElementsEmpty(data)) {
      requestFailed({
        type: "field-missing"
      });
      dispatch(sendingRequest(false));
      return;
    }

    auth.register(data, (success, err) => {

      dispatch(sendingRequest(false));
      dispatch(setAuthState(success));
      if (success) {
        forwardTo('/');
      } else {
        requestFailed(err);
      }
    });
  }
}
