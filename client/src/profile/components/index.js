import React, { Component } from 'react'
import { connect } from 'react-redux'
import profile from '../index'
import UserForm from './user-form'
import SurveyForm from './survey-form'

class ProfileContainer extends Component {
  render() {

    const survey = this.props.data.get('survey')
    const user = this.props.data.get('user').toJS()

    return (
      <div>
        <h1>Profile</h1>
        <div>
          <UserForm
            user={user}
            changeProfile={::this._changeProfile}
            onSubmit={::this._saveProfile}
            availableEthnicities={this.props.availableEthnicities}
            availableGenders={this.props.availableGenders}
            hasChanges={!!this.props.data.get('userUpdated')}
            profileSaved={this.props.data.get('profileSaved')}
          />

          <SurveyForm
            survey={survey}/>
        </div>
      </div>
    );
  }

  _changeProfile(evt) {
    this.props.dispatch(profile.actions.updateProfile(evt.target.id, evt.target.value))
  }

  componentWillMount() {
    this.props.dispatch(profile.actions.getProfile('Alzheimer'))
  }

  _saveProfile(evt) {
    evt.preventDefault()

    this.props.dispatch(profile.actions.saveProfile());
  }
}

ProfileContainer.displayName = 'Profile';

function mapStateToProps(state) {
  return {
    data: state.get('profile'),
    availableEthnicities: state.getIn(['register', 'availableEthnicities']),
    availableGenders: state.getIn(['register', 'availableGenders'])
  };
}

export default connect(mapStateToProps)(ProfileContainer);