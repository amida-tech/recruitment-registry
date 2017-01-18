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
  }

  isStringAcceptable = (string) => {
    return (string.length >= 1);  // Minimum 4 letters long
  }

  render() {
    const {modalStatus, handleChange} = this.props;
    return (
      <Modal
        isOpen={modalStatus}
        shouldCloseOnOverlayClick={true}>
          <div className="questionContent">
            <div>
              <select className="form--select light">
                <option>Dropdown / Select (Single Choice)</option>
              </select>
              <button className="loadButton buttonSecondary light">Load Template</button>
              <div className="changeQuestion">
                <a><i className="fa fa-caret-up" /></a>
                <a><i className="fa fa-caret-down" /></a>
              </div>
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
                  <span className="icon is-small">
                    <i className="fa fa-circle" />
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
                      <i className="fa fa-caret-up" />
                    </span>
                    <span className="icon is-medium">
                      <i className="fa fa-caret-down" />
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
                    <h6 className="questionHead is-marginless gapMediumGray">Question <span>1</span></h6>
                    <br />
                    <div className="questionTitle">
                      <RIEInput
                        value={this.state.questionTitle}
                        change={this.virtualServerCallback}
                        propName="questionTitle"
                        className={this.state.highlight ? "editable" : ""}
                        validate={this.isStringAcceptable}
                        classLoading="loading"
                        classInvalid="invalid" />
                    </div>
                    <br />
                    <div className="questionSubTitle">
                      <RIEInput
                        value={this.state.questionSubTitle}
                        change={this.virtualServerCallback}
                        propName="questionSubTitle"
                        className={this.state.highlight ? "editable" : ""}
                        validate={this.isStringAcceptable}
                        classLoading="loading"
                        classInvalid="invalid" />
                    </div>
                    <SurveyFields.Input />
                  </div>
                </div>
              </article>
            </div>
            <div>
              <button className="loadButton buttonSecondary light">Delete Question</button>
              <button className="buttonPrimary confirm is-pulled-right" onClick={(ev)=>handleChange(false)}>Done Editing</button>
            </div>
          </div>
      </Modal>
  )}
}

AdminAddQuestionModal.propTypes = {
  modalStatus: React.PropTypes.bool.isRequired,
  handleChange: React.PropTypes.func.isRequired
}

export default AdminAddQuestionModal;
