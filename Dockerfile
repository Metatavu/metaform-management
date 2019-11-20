FROM node:erbium
RUN apt update
RUN apt install sass -y
WORKDIR /usr/src/metaform-management
ADD . .
RUN npm install
RUN npm install -g grunt
RUN grunt
RUN npm remove -g grunt
RUN apt purge sass
RUN apt autoremove
EXPOSE 3000
ADD ./docker/entrypoint.sh /opt/docker/entrypoint.sh 
RUN chmod a+x /opt/docker/entrypoint.sh
CMD "/opt/docker/entrypoint.sh"