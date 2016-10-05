import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './login-form';
import login from '../index';

export class LoginContainer extends Component {
  render() {
    const formState = this.props.data.get('formState')
    return (
      <div className="form-page__wrapper">
        <div className="form-page__form-wrapper">
          <div className="form-page__form-header">
            <h2 className="form-page__form-heading">{this.props.vocab.get('LOGIN')}</h2>
          </div>
          <Form data={formState}
                location={location}
                vocab={this.props.vocab}
                history={this.props.history}
                changeForm={::this._changeForm}
                onSubmit={::this._login}
                btnText={this.props.vocab.get('LOGIN')} />
        </div>
      </div>
    );
  }

  _login(evt) {
    evt.preventDefault()

    var username = this.props.data.getIn(['formState', 'username'])
    var password = this.props.data.getIn(['formState', 'password'])

    this.props.dispatch(login.actions.login(username, password));
  }

  _changeForm(evt) {
    this.props.dispatch(login.actions.update(evt.target.id, evt.target.value))
  }
}

//const mapStateToProps = function(store) {
function mapStateToProps(store) {
  return {
    data: store.get('login'),
    vocab: store.getIn(['settings', 'language', 'vocabulary'])
  };
}

export default connect(mapStateToProps)(LoginContainer);
