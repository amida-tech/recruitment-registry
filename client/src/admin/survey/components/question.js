import React, { Component} from 'react';
import Modal from 'react-modal';
import './index.scss';
import * as SurveyFields from '../../../common/SurveyFields';
import {RIEInput} from 'riek';

export class AdminAddQuestionModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      highlight: false,
      simulateXHR: false,
      questionTitle: "Your Question Title Here.",
      questionSubTitle: "Your Question SubText Here."
    }
  }

  virtualServerCallback = (newState) => {
    if (this.state.simulateXHR) {
    window.setTimeout(function() {
      this.changeState(newState);
    }.bind(this), this.state.XHRDelay);
    } else {
    this.changeState(newState);
    }
  };

  changeState = (newState) => {
    this.setState(newState);
  };

  isStringAcceptable = (string) => {
    return (string.length >= 1);  // Minimum 4 letters long
  };

  render() {
    const modalStatus = this.props.modalStatus;
    return (
      <Modal
        isOpen={modalStatus}>
          <div className="questionContent">
            <div>
              <select className="form--select light">
                <option>Dropdown / Select (Single Choice)</option>
              </select>
              <button className="loadButton buttonSecondary light">Load Template</button>
            </div>
            <div className="control is-grouped">
              <div className="control">
                <a className="button is-primary is-inverted">
                  <span className="icon">
                    <i className="fa fa-check" />
                  </span>
                  <span>Required</span>
                </a>
              </div>
              <div className="control">
                <a className="button is-white is-outlined">
                  <span className="icon">
                    <i className="fa fa-check" />
                  </span>
                  <span>Beginning of Section</span>
                </a>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>OPTION LABEL</th>
                  <th>Instrument</th>
                  <th>DATA VALUES</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>North Carolina</td>
                  <td>"northCarolina"</td>
                  <td className="has-text-right">
                    <span className="icon is-medium">
                      <i className="fa fa-sort-asc" />
                    </span>
                    <span className="icon is-medium">
                      <i className="fa fa-sort-desc" />
                    </span>
                    <span className="icon is-medium">
                      <i className="fa fa-trash" />
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="has-text-right" colSpan="3">
                    <button className="buttonPrimary confirm">Add New Value</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="box">
              <article className="media">
                <div className="media-content">
                  <div className="content">
                    <h4 className="title is-6 is-marginless gapMediumGray">Question 1</h4>
                    <br />
                    <RIEInput
                      value={this.state.questionTitle}
                      change={this.virtualServerCallback}
                      propName="questionTitle"
                      className={this.state.highlight ? "editable" : ""}
                      validate={this.isStringAcceptable}
                      classLoading="loading"
                      classInvalid="invalid" />
                    <br /><br />
                    <RIEInput
                      value={this.state.questionSubTitle}
                      change={this.virtualServerCallback}
                      propName="questionSubTitle"
                      className={this.state.highlight ? "editable" : ""}
                      validate={this.isStringAcceptable}
                      classLoading="loading"
                      classInvalid="invalid" />
                    <SurveyFields.Input />
                  </div>
                </div>
              </article>
            </div>
            <div>
              <button className="loadButton buttonSecondary light">Delete Question</button>
              <button className="buttonPrimary confirm is-pulled-right">Done Editing</button>
            </div>
          </div>
      </Modal>
  )}
}

AdminAddQuestionModal.propTypes = {
  modalStatus: React.PropTypes.bool.isRequired
}

export default AdminAddQuestionModal;
