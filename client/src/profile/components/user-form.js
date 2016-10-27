import React, { Component } from 'react';

class UserForm extends Component {
  render() {

    const {user} = this.props

    const renderSelectField = (id, defaultValue, label, options) => (
      <div>
        <label className="rr" htmlFor="gender">{label}</label>
        <select required onChange={this.props.changeProfile} defaultValue={defaultValue} className="rr rr-field" id={id}>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    );

    return(
      <div>
    { user.username ? (
      <form className="rr-form m-x-1" onSubmit={this.props.onSubmit}>
        <h2 className="m-t-1">{user.username}</h2>
        <div className="">

          <div className="rr-group">
            <label className="rr" htmlFor="password">{this.props.vocab.get('NEW_PASSWORD')}</label>
            <input className="rr-field" id="password" type="password" onChange={this.props.changeProfile}/>
          </div>

          <div className="rr-group">
            <label className="rr">{this.props.vocab.get('EMAIL')}</label>
            <input className="rr rr-field" type="text" id="email" defaultValue={user.email}
                   onChange={this.props.changeProfile}/>
          </div>

          <div className="rr-group">
            <label className="rr">{this.props.vocab.get('ZIP')}</label>
            <input className="rr rr-field" type="text" id="zip" defaultValue={user.zip}
                   onChange={this.props.changeProfile}/>
          </div>

          {renderSelectField("gender", user.gender, this.props.vocab.get('GENDER'), this.props.availableGenders)}

          {renderSelectField("ethnicity", user.ethnicity, this.props.vocab.get('ETHNICITY'), this.props.availableEthnicities)}

          <p>{this.props.profileSaved ? this.props.vocab.get('SAVE_PROFILE') : ""}</p>
          <div className="rr-controls">
            <button disabled={!this.props.hasChanges} className="rr-button btn" type="submit">{this.props.vocab.get('SAVE_PROFILE')} </button>
          </div>
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
  availableEthnicities: React.PropTypes.object.isRequired,
}

export default UserForm;
