FROM node:16.20.2

# Create app directory
WORKDIR /app/BACK

COPY ./backend .
COPY ./deployment/back/.env .env

# Install app dependencies
RUN npm install

RUN npm run build

# RUN npm uninstall bcrypt
# RUN npm i bcrypt
COPY ./deployment/back/init.sh .

EXPOSE 9000
CMD ["sh", "init.sh"]
