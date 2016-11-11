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
          { loggedIn &&
            <h6><span style={{color: "#2196F3"}}>{ username }</span>, {this.props.vocab.get('WELCOME')} { title }, {this.props.vocab.get('LOGGED_IN_AS')} <span style={{color: "#2196F3"}}>{ role }</span>!</h6>
          }

        </div>
        <form className="radioGroup">
          <input type="radio" checked="checked" name="gender" id="male" value="male"/>
          <label htmlFor="male">Male</label>
          <input type="radio" name="gender" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup light">
          <input type="radio" checked="checked" name="gender1" id="male1" value="male1"/>
          <label htmlFor="male1">Male</label>
          <input type="radio" name="gender1" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender1" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup success">
          <input type="radio" checked="checked" name="gender2" id="male2" value="male2"/>
          <label htmlFor="male2">Male</label>
          <input type="radio" name="gender2" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender2" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup confirm">
          <input type="radio" checked="checked" name="gender3" id="male3" value="male3"/>
          <label htmlFor="male3">Male</label>
          <input type="radio" name="gender3" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender3" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup alert">
          <input type="radio" checked="checked" name="gender4" id="male4" value="male4"/>
          <label htmlFor="male4">Male</label>
          <input type="radio" name="gender4" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender4" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup warning">
          <input type="radio" checked="checked" name="gender5" id="male5" value="male5"/>
          <label htmlFor="male5">Male</label>
          <input type="radio" name="gender5" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender5" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup info">
          <input type="radio" checked="checked" name="gender6" id="male6" value="male6"/>
          <label htmlFor="male6">Male</label>
          <input type="radio" name="gender6" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender6" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup system">
          <input type="radio" checked="checked" name="gender7" id="male7" value="male7"/>
          <label htmlFor="male7">Male</label>
          <input type="radio" name="gender7" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender7" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>
        <form className="radioGroup dark">
          <input type="radio" checked="checked" name="gender8" id="male8" value="male8"/>
          <label htmlFor="male8">Male</label>
          <input type="radio" name="gender8" id="female" value="female"/>
          <label htmlFor="female">Female</label>
          <input type="radio" name="gender8" id="other" value="other"/>
          <label htmlFor="other">Other</label>
        </form>



        <select className="form--select">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select light">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select success">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select confirm">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select alert">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select warning">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select info">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select system">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
        <select className="form--select dark">
          <option value="A">I'm not sure</option>
          <option value="B">Banana</option>
          <option value="C">Cranberry</option>
        </select>
      </div>
    );
  }

  componentWillMount() {
    this.props.dispatch({type: "GET_USER"})
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
