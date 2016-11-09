import React, { Component } from 'react';
import { Link } from 'react-router';

class Form extends Component {
  render() {
    return(
      <form onSubmit={this.props.onSubmit}>
        <h1>{this.props.vocab.get('SIGN_IN')}</h1>
        <div>
          <label htmlFor="username">{this.props.vocab.get('USERNAME')}</label>
          <input
            className="form__field-input"
            type="text"
            id="username"
            onChange={ this.props.changeForm }
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder={this.props.vocab.get('USERNAME')}/>
        </div>
        <div>
          <label htmlFor="password">{this.props.vocab.get('PASSWORD')}</label>
          <input className="form__field-input"
            id="password"
            type="password"
            onChange={ this.props.changeForm }
            placeholder={this.props.vocab.get('PASSWORD')} />
        </div>
          { this.props.data.get('hasErrors') &&
            <div className="displayBox warning animated fadeInUp">
              {this.props.vocab.get('INVALID_CREDENTIALS')}</div> }
        <div className="form__footer">
          <button className="buttonPrimary confirm" type="submit">
            {this.props.btnText}</button>
          <Link to="/">{this.props.vocab.get('FORGOT_USER_PASS')}</Link>
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
