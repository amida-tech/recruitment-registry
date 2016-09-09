import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './login-form';
import { login } from '../../login/actions';

export class LoginContainer extends Component {
  render() {
    const dispatch = this.props.dispatch;
    const { formState } = this.props.data;
    const { loggedIn } = this.props;
    return (
      <div> { !loggedIn ? (
        <div className="form-page__wrapper">
          <div className="form-page__form-wrapper">
            <div className="form-page__form-header">
              <h2 className="form-page__form-heading">Login</h2>
            </div>
            <Form dispatch={dispatch} data={formState} location={location} history={this.props.history} onSubmit={::this._login} btnText={"LoginContainer"} />
          </div>
        </div>) : (<h3>You are already logged in :)</h3>) }
      </div>
    );
  }

  _login(username, password) {
    this.props.dispatch(login(username, password));
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.login,
    loggedIn: store.loggedIn
  };
}

export default connect(mapStateToProps)(LoginContainer);