import React, { Component } from 'react';
import { connect } from 'react-redux';

class Home extends Component {
  render() {

    const title = this.props.data.get('title');
    const loggedIn = this.props.data.get('loggedIn');
    const role = this.props.user.get('role');
    const username = this.props.user.get('username');
    document.getElementsByTagName('body')[0].className+=' ';
    return (
      <div className="home">
        <h1>{this.props.vocab.get('HOME')}</h1>
        <div>
          { loggedIn ? (
            <h6> <span style={{color: "#2196F3"}}>{ username }</span>, {this.props.vocab.get('WELCOME')} { title }, {this.props.vocab.get('LOGGED_IN_AS')} <span style={{color: "#2196F3"}}>{ role }</span>!</h6>
          ) : (<div></div>)
          }

        </div>
        <form className="form" onSubmit={this.props.onSubmit}>
            <input className="form__field-input" id="password" name="fuck" type="radio" onChange={ this.props.changeForm } placeholder={this.props.vocab.get('PASSWORD')} />
            <input className="form__field-input" id="password" name="fuck" type="radio" onChange={ this.props.changeForm } placeholder={this.props.vocab.get('PASSWORD')} />
        </form>
        <select className="form-select">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
      </div>
    );
  }
}

Home.displayName = 'Home';

function mapStateToProps(state) {
  return {
    data: state,
    user: state.getIn(['login', 'user']),
    vocab: state.getIn(['settings', 'language', 'vocabulary'])
  };
}

export default connect(mapStateToProps)(Home);
