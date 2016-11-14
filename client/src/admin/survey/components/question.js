import React, { Component} from 'react';
import Modal from 'react-modal';
import './index.scss';
import * as SurveyFields from '../../../common/SurveyFields';

export class AdminAddQuestionModal extends Component {

  render() {
    console.log(this.props);
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
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="box">
              <article className="media">
                <div className="media-content">
                  <div className="content">
                    <h4 className="title is-6 is-marginless gapMediumGray">Question 1</h4>
                    <SurveyFields.Input />
                  </div>
                </div>
              </article>
            </div>
          </div>
      </Modal>
  )}
}

AdminAddQuestionModal.propTypes = {
  modalStatus: React.PropTypes.bool.isRequired
}

export default AdminAddQuestionModal;
