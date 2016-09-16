import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './login-form';
import login from '../index';

export class LoginContainer extends Component {
  render() {
    const { formState } = this.props.data;
    const { loggedIn } = this.props;
    return (
      <div> { !loggedIn ? (
        <div className="form-page__wrapper">
          <div className="form-page__form-wrapper">
            <div className="form-page__form-header">
              <h2 className="form-page__form-heading">Login</h2>
            </div>
            <Form data={formState}
                  location={location}
                  history={this.props.history}
                  changeForm={::this._changeForm}
                  onSubmit={::this._login}
                  btnText={"Login"} />
          </div>
        </div>) : (<h3>You are already logged in :)</h3>) }
      </div>
    );
  }

  _login(evt) {
    evt.preventDefault()
    this.props.dispatch(login.actions.login(this.props.data.formState.username, this.props.data.formState.password));
  }

  _changeForm(evt) {
    this.props.dispatch(login.actions.update(evt.target.id, evt.target.value))
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.login,
    loggedIn: store.loggedIn
  };
}

export default connect(mapStateToProps)(LoginContainer);