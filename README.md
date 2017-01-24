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
  	1. The contents of the api .env file should be: 
	    ```RECREG_DB_DATABASE=recreg
	    RECREG_DB_USER=kevmo
	    RECREG_DB_PW=TDP#2016!
	    RECREG_DB_HOST=localhost
	    RECREG_DB_PORT=5432
	    RECREG_DB_DIALECT=postgres
	    RECREG_DB_POOL_MAX=5
	    RECREG_DB_MIN=0
	    RECREG_DB_IDLE=10000
	    DEBUGXX="swagger-tools:middleware:*"
	    RECREG_LOGGING_LEVEL=emerg
	    RECREG_CLIENT_BASE_URL="http://localhost:4000/reset-tokens/"
	    RECREG_CORS_ORIGIN=http://localhost:4000```
    2. The contens of the client .env file should be:
   		```NODE_ENV=development
		API_HTTP_URL="http://localhost:9005/api/v1.0"
		API_HTTPS_URL="https://localhost:9005/api/v1.0"

		NODE_ENV=development
		PROD_API_HTTP_URL="http://localhost:9005/api/v1.0""
		PROD_API_HTTPS_URL="http://localhost:9005/api/v1.0""
		API_HTTP_URL="http://localhost:9005/api/v1.0""
		API_HTTPS_URL="http://localhost:9005/api/v1.0""```
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
