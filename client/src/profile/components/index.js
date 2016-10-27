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
      <div className="rr-wrapper">
        <div className="rr-panel">
          <div className="rr-topbox">
            <h1 className="rr m-t-0">{this.props.vocab.get('PROFILE')}</h1>
          </div>
          <div>
            <UserForm
              user={user}
              vocab={this.props.vocab}
              changeProfile={::this._changeProfile}
              onSubmit={::this._saveProfile}
              availableEthnicities={this.props.availableEthnicities}
              availableGenders={this.props.availableGenders}
              hasChanges={!!this.props.data.get('userUpdated')}
              profileSaved={this.props.data.get('profileSaved')}
            />

            <SurveyForm
              survey={survey}
              vocab={this.props.vocab}
            />
          </div>
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
    availableGenders: state.getIn(['register', 'availableGenders']),
    vocab: state.getIn(['settings', 'language', 'vocabulary'])
  };
}

export default connect(mapStateToProps)(ProfileContainer);
