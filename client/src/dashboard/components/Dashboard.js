import React, { Component } from 'react';

class Dashboard extends Component {
  render() {
    return <div id="dashboard">
        <div id="dashboardHeader">
            <div id="surveyStepsNeeded">
                <span>
                In order to be matched with clinical trials, You need to complete a consent and health questionnaire. These will take approximately 2 hours to complete. This does not need to be completed in a single sitting.
                </span>
                <button>Match me with clinical trials.</button>
            </div>
            <div id="utility--background" className="blue"></div>
        </div>
    </div>
  }
}

export default Dashboard;
