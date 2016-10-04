import React, { Component } from 'react';

class Form extends Component {
  render() {

    return(
      <form className="form" onSubmit={this.props.onSubmit}>
        <div className="">
          { this.props.data.get('hasErrors') ? (<p>Invalid credentials!</p>) : (<p></p>) }
        </div>
        <div className="form__field-wrapper">
          <input className="form__field-input" type="text" id="username" onChange={ this.props.changeForm } autoCorrect="off" autoCapitalize="off" spellCheck="false" />
          <label className="form__field-label" htmlFor="username">Username</label>
        </div>
        <div className="form__field-wrapper">
          <input className="form__field-input" id="password" type="password" onChange={ this.props.changeForm } />
          <label className="form__field-label" htmlFor="password">Password</label>
        </div>
        <div className="form__submit-btn-wrapper">
          <button className="form__submit-btn" type="submit">{ this.props.btnText }</button>
        </div>
      </form>
    );
  }
}

Form.propTypes = { //{this.vocab.get('PASSWORD')}
  onSubmit: React.PropTypes.func.isRequired,
  btnText: React.PropTypes.string.isRequired,
  data: React.PropTypes.object.isRequired,
  changeForm: React.PropTypes.func.isRequired
}

export default Form;
