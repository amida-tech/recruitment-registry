import React, { Component } from 'react';
import { connect } from 'react-redux';

class Home extends Component {
  render() {

    const title = this.props.data.get('title');
    const loggedIn = this.props.data.get('loggedIn');
    const role = this.props.user.get('role');
    const username = this.props.user.get('username');
    return (
      <div>
        <h1>{this.props.vocab.get('HOME')}</h1>
        <div>
          { loggedIn ? (
            <h6> <span style={{color: "#2196F3"}}>{ username }</span>, welcome to the { title }, you are logged in as <span style={{color: "#2196F3"}}>{ role }</span>!</h6>
          ) : (<div></div>)
          }
        </div>
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
