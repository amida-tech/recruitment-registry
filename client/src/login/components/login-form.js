import React, { Component } from 'react';
import actions from '../index';
const assign = Object.assign || require('object.assign');

class Form extends Component {
  render() {

    return(
      <form className="form" onSubmit={this._onSubmit.bind(this)}>
        <div className="">
          { this.props.data.hasErrors ? (<p>Invalid credentials!</p>) : (<p></p>) }
        </div>
        <div className="form__field-wrapper">
          <input className="form__field-input" type="text" id="username" value={this.props.data.username} onChange={this._changeUsername.bind(this)} autoCorrect="off" autoCapitalize="off" spellCheck="false" />
          <label className="form__field-label" htmlFor="username">Username</label>
        </div>
        <div className="form__field-wrapper">
          <input className="form__field-input" id="password" type="password" value={this.props.data.password} onChange={this._changePassword.bind(this)} />
          <label className="form__field-label" htmlFor="password">Password</label>
        </div>
        <div className="form__submit-btn-wrapper">
          <button className="form__submit-btn" type="submit">{this.props.btnText}</button>
        </div>
      </form>
    );
  }

  _changeUsername(evt) {
    var newState = this._mergeWithCurrentState({
      username: evt.target.value
    });

    this._emitChange(newState);
  }

  _changePassword(evt) {
    var newState = this._mergeWithCurrentState({
      password: evt.target.value
    });

    this._emitChange(newState);
  }

  _mergeWithCurrentState(change) {
    return assign(this.props.data, change);
  }

  _emitChange(newState) {
    this.props.dispatch(actions.changeForm(newState));
  }

  _onSubmit(evt) {
    evt.preventDefault();
    this.props.onSubmit(this.props.data.username, this.props.data.password);
  }
}

Form.propTypes = {
  onSubmit: React.PropTypes.func.isRequired,
  btnText: React.PropTypes.string.isRequired,
  data: React.PropTypes.object.isRequired
}

export default Form;