import * as t from './actionTypes';

import { browserHistory } from 'react-router';
import bcrypt from 'bcryptjs';
import auth from '../utils/auth';
import genSalt from '../utils/salt';

export function changeForm(newState) {
  return { type: t.CHANGE_FORM, newState };
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

export function login(username, password) {
  return (dispatch) => {
    dispatch(sendingRequest(true));
    removeLastFormError();
    if (anyElementsEmpty({ username, password })) {
      requestFailed({
        type: "field-missing"
      });
      dispatch(sendingRequest(false));
      return;
    }

    auth.login(username, password, (success, err) => {
      dispatch(sendingRequest(false));
      dispatch(setAuthState(success));

      if (success === true) {
        forwardTo('/');
        dispatch(changeForm({
          username: "",
          password: ""
        }));
      } else {
        requestFailed(err);
      }
    });
  }
}

export function logout() {
  return (dispatch) => {
    dispatch(sendingRequest(true));
    auth.logout((success, err) => {
      if (success === true) {
        dispatch(sendingRequest(false));
        dispatch(setAuthState(false));
        browserHistory.replace(null, '/');
      } else {
        requestFailed(err);
      }
    });
  }
}
