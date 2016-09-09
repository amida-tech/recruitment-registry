import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from './register-form';
import register from '../index';

export class RegisterContainer extends Component {
  render() {
    const dispatch = this.props.dispatch;
    const { formState } = this.props.data;
    const { loggedIn } = this.props;
    return (
      <div> { !loggedIn ? (
        <div className="container">
            <div className="form-page__form-header">
              <h2 className="form-page__form-heading">Register</h2>
            </div>
            <Form data={formState}
                  dispatch={dispatch}
                  location={location}
                  history={this.props.history}
                  onSubmit={::this._onSubmit}
                  btnText={"Register"}
                  changeForm={::this._changeForm}/>
        </div>) : ( <h3>You are already logged in :)</h3>) }
      </div>)
  }

  _changeForm(evt) {
    this.props.dispatch(register.actions.update(evt.target.id, evt.target.value));
  }

  _onSubmit(evt) {
    evt.preventDefault();
    this.props.dispatch(register.actions.register(this.props.data.formState));
  }
}

const mapStateToProps = function(store) {
  return {
    data: store.register,
    loggedIn: store.loggedIn
  };
}

export default connect(mapStateToProps)(RegisterContainer);