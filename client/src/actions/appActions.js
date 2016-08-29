import bcrypt from 'bcryptjs';
import { SET_AUTH, CHANGE_FORM, SENDING_REQUEST } from '../constants/appConstants';
import auth from '../utils/auth';
import genSalt from '../utils/salt';
import { browserHistory } from 'react-router';

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

    const salt = genSalt(username);

    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        requestFailed({
          type: 'failed'
        });
        return;
      }

      auth.login(username, hash, (success, err) => {
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

export function register(username, password) {
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

    const salt = genSalt(username);

    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        requestFailed({
          type: 'failed'
        });
        return;
      }

      auth.register(username, hash, (success, err) => {

        dispatch(sendingRequest(false));
        dispatch(setAuthState(success));
        if (success) {
          forwardTo('/');
          dispatch(changeForm({
            username: "",
            password: ""
          }));
        } else {
          requestFailed(err);
        }
      });
    });
  }
}

export function setAuthState(newState) {
  return { type: SET_AUTH, newState };
}

export function changeForm(newState) {
  return { type: CHANGE_FORM, newState };
}

export function sendingRequest(sending) {
  return { type: SENDING_REQUEST, sending };
}

function forwardTo(location) {
  console.log('forwardTo(' + location + ')');
  browserHistory.push(location);
}

let lastErrType = "";

function requestFailed(err) {
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

/**
 * Removes the last error from the form
 */
function removeLastFormError() {
  const form = document.querySelector('.form-page__form-wrapper');
  form.classList.remove('js-form__err--' + lastErrType);
}

/**
 * Checks if any elements of a JSON object are empty
 * @param  {object} elements The object that should be checked
 * @return {boolean}         True if there are empty elements, false if there aren't
 */
function anyElementsEmpty(elements) {
  for (let element in elements) {
    if (!elements[element]) {
      return true;
    }
  }
  return false;
}