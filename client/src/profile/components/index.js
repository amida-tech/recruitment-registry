import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import Form from './profile-form'
import profile from '../index'

class ProfileContainer extends Component {
  render() {

    const { survey, user } = this.props.data;
    const {loggedIn} = this.props;

    return (
      <div>
        <h1>Profile</h1>
        <div>
          { loggedIn && survey ? (
            <Form survey={survey}
                  user={user}
                  hasChanges={!!this.props.data.userUpdated}
                  profileSaved={this.props.data.profileSaved}
                  availableEthnicities={this.props.availableEthnicities}
                  availableGenders={this.props.availableGenders}
                  changeProfile={ ::this._changeProfile }
                  onSubmit={ ::this._onSubmit }/>
          ) : (<div><Link to="/login">Login</Link></div>)
          }
        </div>
      </div>
    );
  }

  _changeProfile(evt) {
    this.props.dispatch(profile.actions.updateProfile(evt.target.id, evt.target.value))
  }

  componentWillMount() {
    if (this.props.loggedIn) {
      this.props.dispatch({type: 'GET_PROFILE', surveyName: 'Alzheimer'})
    }
  }

  _onSubmit(evt) {
    evt.preventDefault()

    this.props.dispatch(profile.actions.saveProfile());
  }
}

ProfileContainer.displayName = 'Profile';

function select(state) {
  return {
    data: state.profile,
    loggedIn: state.loggedIn,
    availableEthnicities: state.register.availableEthnicities,
    availableGenders: state.register.availableGenders
  };
}

export default connect(select)(ProfileContainer);