import React, { Component } from 'react';
import { Link } from 'react-router';

class Dashboard extends Component {
  render() {
    return <div id="dashboard">
        <div id="dashboardHeader">
            <div id="surveyStepsNeeded">
                <span>
                In order to be matched with clinical trials, You need to complete a consent and health questionnaire. These will take approximately 2 hours to complete. This does not need to be completed in a single sitting.
                </span>
                <Link className="btn" to="/surveys">Match me with clinical trials.</Link>
            </div>
            <div id="utility--background" className="blue"></div>
        </div>
    </div>
  }
}

export default Dashboard;
