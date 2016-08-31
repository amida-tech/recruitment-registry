import bcrypt from 'bcryptjs';
import auth from '../utils/auth';
import genSalt from '../utils/salt';
import { browserHistory } from 'react-router';
import { sendingRequest, removeLastFormError, requestFailed, anyElementsEmpty, changeForm, setAuthState, forwardTo } from '../form/actions';

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
