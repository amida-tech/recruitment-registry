import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from '../form/index';
import { login } from './actions';

export class Login extends Component {
  render() {
    const dispatch = this.props.dispatch;
    const { formState, loggedIn, currentlySending } = this.props.data;
    return (
      <div> { !loggedIn ? (
        <div className="form-page__wrapper">
          <div className="form-page__form-wrapper">
            <div className="form-page__form-header">
              <h2 className="form-page__form-heading">Login</h2>
            </div>
            <Form data={formState} dispatch={dispatch} location={location} history={this.props.history} onSubmit={::this._login} btnText={"Login"} currentlySending={currentlySending}/>
          </div>
        </div>) : (<h3>You are already logged in :)</h3>) }
      </div>
    );
  }

  _login(username, password) {
    this.props.dispatch(login(username, password));
  }
}

function select(state) {
  return {
    data: state
  };
}

export default connect(select)(Login);