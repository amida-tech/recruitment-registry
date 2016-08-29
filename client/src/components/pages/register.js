import React, { Component} from 'react';
import { connect } from 'react-redux';
import Form from '../form';
import { register } from '../../actions/appActions';

export class Register extends Component {
  render() {
    const dispatch = this.props.dispatch;
    const { formState, loggedIn, currentlySending } = this.props.data;
    return (
      <div> { !loggedIn ? (
        <div className="form-page__wrapper">
          <div className="form-page__form-wrapper">
            <div className="form-page__form-header">
              <h2 className="form-page__form-heading">Register</h2>
            </div>
            <Form data={formState}
                  dispatch={dispatch}
                  location={location}
                  history={this.props.history}
                  onSubmit={::this._register}
                  btnText={"Register"}
                  currentlySending={currentlySending}/>
          </div>
        </div>) : ( <h3>You are already logged in :)</h3>) }
        </div>)
  }

  _register(username, password) {
    this.props.dispatch(register(username, password));
  }
}

function select(state) {
  return {
    data: state
  };
}
export default connect(select)(Register);