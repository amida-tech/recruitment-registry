# Dockerfile
FROM quay.io/aptible/nodejs:v6.9.x

RUN apt-get update && apt-get upgrade -y && \
    apt-get install python2.7 -y && \
    apt-get install make -y && \
    apt-get install build-essential g++ -y

ENV PYTHON /usr/bin/python2.7

# Add package.json before rest of repo, for Docker caching purposes
# See http://ilikestuffblog.com/2014/01/06/
ADD package.json /app/
WORKDIR /app
RUN npm install --production

# If you use Bower, uncomment the following lines:
# RUN npm install -g bower
# ADD bower.json /app/
# RUN bower install --allow-root

ADD . /app
RUN touch .env

# Run any additional build commands here...
# RUN grunt some:task

ENV PORT 9005
EXPOSE 9005