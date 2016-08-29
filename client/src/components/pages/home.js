import React, { Component } from 'react';
import { connect } from 'react-redux';

class Home extends Component {
  render() {

    const { loggedIn, title } = this.props.data;

    return (
      <div>
        <h1>Home</h1>
        <div>
          { loggedIn ? (
            <h6>Welcome to the { title }, you are logged in!</h6>
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
    data: state
  };
}

export default connect(select)(Home);