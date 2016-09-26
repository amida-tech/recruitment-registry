import React, { Component } from 'react';

class UserForm extends Component {
  render() {

    const {user} = this.props

    const renderSelectField = (id, defaultValue, label, options) => (
      <div className="form-group">
        <label htmlFor="gender">{label}</label>
        <select required onChange={this.props.changeProfile} defaultValue={defaultValue} className="form-control" id={id}>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    );

    return(
      <div>
    { user ? (
      <form onSubmit={this.props.onSubmit}>
        <h2>{user.get('username')}</h2>
        <div>

          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input className="form-control" id="password" type="password" onChange={this.props.changeProfile}/>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="text" id="email" defaultValue={user.get('email')}
                   onChange={this.props.changeProfile}/>
          </div>

          <div className="form-group">
            <label>ZIP</label>
            <input className="form-control" type="text" id="zip" defaultValue={user.zip}
                   onChange={this.props.changeProfile}/>
          </div>

          {renderSelectField("gender", user.get('gender'), "Gender", this.props.availableGenders)}

          {renderSelectField("ethnicity", user.get('ethnicity'), "Ethnicity", this.props.availableEthnicities)}

          <p>{this.props.profileSaved ? "Profile Saved" : ""}</p>

          <button disabled={!this.props.hasChanges} className="form__submit-btn" type="submit">Save profile</button>
        </div>
      </form>) : (<div></div>)
    }
    </div>
    )
  }
}

UserForm.propTypes = {
  user: React.PropTypes.object,
  changeProfile: React.PropTypes.func.isRequired,
  availableGenders: React.PropTypes.object.isRequired,
  availableEthnicities: React.PropTypes.object.isRequired
}

export default UserForm;