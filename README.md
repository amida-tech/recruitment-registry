#Recruitment Registry

Recruitment Registry is a platform for participants to complete surveys and find local and matching clinical trials. It is also a platform for clinicians to perform cohort shaping on the survey’s answers, and to find participants for their clinical trials.

##Getting Started

Recruitment Registry is a tool that consists of two node projects, api and client. You must properly install and run both node projects at the same time for the tool to work correctly.

##Prerequisites

1. Node.js v6 or newer
2. PostgreSQL v9.4 or newer
3. Grunt

##Installing

1. Clone the repository
2. Cd into api directory
3. Call `npm install`  to download dependencies
4. Repeat Step 2 and 3 in the client directory
5. Get Postgres up and running
  1. Open Postgres and hit initialize
6. Modify $PATH before creating database in Postgres
  1. Call `echo $PATH` to view current path
  2. If `/Applications/Postgres.app/Contents/Versions/latest/bin`  is not part of your current $PATH call do step i:
    1. Call `export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin`
7. Create database in Postgres with the command `createdb recreg`
8. Create .env root files in both api and client directories
  1. The contents of the api .env file should be `
9. Run sync files (in api directory):
  1. Use these calls:
          node syncAndLoadAlzheimers.js
          node syncDecember15.js
          node syncDemo.js
10. Run program:
  1. Need to run both front and back end at the same time
    1. Front-End:
      1. Open client directory
      2. Call `npm start`
    2. Back-End:
      1. Open api directory
      2. Call `npm start`

##Running the tests

Run tests both in the api and client directory calling:

    `npm test`

##Deployment

Add additional notes about how to deploy this on a live system

Built With
- Dropwizard - The web framework used
- Maven - Dependency Management
- ROME - Used to generate RSS Feeds


##Versioning

We use SemVer for versioning. For the versions available, see the tags on this repository.

##Contributors

Amida Team

- Mike Hiner
- Kevin Moore
- Jon Berry  
- Lacey Irvin
- Jonah Bregstone
- Giulio Capolino

##License

This project is licensed under the MIT License - see the LICENSE.md file for details

##Acknowledgments
- Hat tip to anyone who's code was used
- Inspiration
- etc
