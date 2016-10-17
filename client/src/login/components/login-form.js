import React, { Component } from 'react';

class Form extends Component {
  render() {
    return(
      <form className="form" onSubmit={this.props.onSubmit}>
        <h1>Sign In</h1>
        <div className="">
          { this.props.data.get('hasErrors') ? (<p>{this.props.vocab.get('INVALID_CREDENTIALS')}</p>) : (<p></p>) }
        </div>
        <div className="rr-group">
          <label className="rr" htmlFor="username">{this.props.vocab.get('EMAIL')}</label>
          <input className="form__field-input" type="text" id="username" onChange={ this.props.changeForm } autoCorrect="off" autoCapitalize="off" spellCheck="false" placeholder={this.props.vocab.get('EMAIL')}/>
        </div>
        <div className="rr-group m-t-1">
          <label className="rr" htmlFor="password">{this.props.vocab.get('PASSWORD')}</label>
          <input className="form__field-input" id="password" type="password" onChange={ this.props.changeForm } placeholder={this.props.vocab.get('PASSWORD')} />
        </div>
        <div className="form__footer">
          <button className="buttonConfirm" type="submit">{ this.props.btnText }</button>
          <a href="/">{this.props.vocab.get('FORGOT_USER_PASS')}</a>
        </div>
      </form>
    );
  }
}

Form.propTypes = {
  onSubmit: React.PropTypes.func.isRequired,
  btnText: React.PropTypes.string.isRequired,
  data: React.PropTypes.object.isRequired,
  changeForm: React.PropTypes.func.isRequired
}

export default Form;
