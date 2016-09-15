import React, { Component } from 'react';
import { connect } from 'react-redux';

class Home extends Component {
  render() {

    const { title } = this.props.data;
    const { loggedIn } = this.props.data;
    const { role, username } = this.props.user;
    return (
      <div>
        <h1>Home</h1>
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

function select(state) {
  return {
    data: state,
    user: state.login.user
  };
}

export default connect(select)(Home);