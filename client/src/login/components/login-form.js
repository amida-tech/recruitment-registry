import React, { Component } from 'react';

class Form extends Component {
  render() {
    return(
      <form className="rr-form m-x-1" onSubmit={this.props.onSubmit}>
        <div className="">
          { this.props.data.get('hasErrors') ? (<p>{this.props.vocab.get('INVALID_CREDENTIALS')}</p>) : (<p></p>) }
        </div>
        <div className="rr-group">
          <label className="rr" htmlFor="username">{this.props.vocab.get('EMAIL')}</label>
          <input className="rr rr-field rr-hint" type="text" id="username" onChange={ this.props.changeForm } autoCorrect="off" autoCapitalize="off" spellCheck="false" placeholder={this.props.vocab.get('EMAIL')}/>
        </div>
        <div className="rr-group m-t-1">
          <label className="rr" htmlFor="password">{this.props.vocab.get('PASSWORD')}</label>
          <input className="rr-field rr-hint" id="password" type="password" onChange={ this.props.changeForm } />
        </div>
        <div className="rr-controls">
          <button className="rr-button btn" type="submit">{ this.props.btnText }</button>
        </div>
        <div className="rr rr-hint no-transform m-b-1">
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
