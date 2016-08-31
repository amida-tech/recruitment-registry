import bcrypt from 'bcryptjs';
import auth from '../utils/auth';
import genSalt from '../utils/salt';
import { sendingRequest, removeLastFormError, anyElementsEmpty, requestFailed, setAuthState, forwardTo, changeForm } from '../form/actions';

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