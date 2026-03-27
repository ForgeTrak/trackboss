# trackboss - making it work

## Front end, backend, and DB
### Tooling and languages
Trackboss is a NodeJS (express) back end with a React 18 front end. All the code is Typescript.  The database back end is MySQL.  All of those will need to be installed to make it work for development.

Once that is done you can `npm install` and run normally in an IDE.  I use VSCode so there is even a `.vscode/` directory attached to the project.

I use `nvm` to manage Node versions. Currently this project is using Node 24.

### Environment
The project runs off of a `.env` file that has to be sourced by the IDE at startup.  To do this on a Mac I run `source .env` on the project root, then `vscode` to get into the project.

The .env file looks like this.  I can get you proper values securely.
````
# these are for login on Cognito (a standard IDP type login)
export COGNITO_POOL_ID=
export COGNITO_CLIENT_ID=
# self explanatory
export MYSQL_DB=
export MYSQL_HOST=
export MYSQL_USER=
export MYSQL_PASS=
# the place to send emails to that would normally go to our club secretary
export CLUB_EMAIL=
# used to figure out what domain to use - devops thing
export TRACKBOSS_ENVIRONMENT_NAME= 
export AWS_REGION=us-east-1
# square is used for payment links for our yearly billing.
export SQUARE_TOKEN=
export SQUARE_LOCATION=
````
You will also need a AWS account and an access key and ID.  I can get you that too.

## Builds
Builds run on Github Actions, and the code for it is in the `.github` folder. They run code that is contained in the `devops/deploy` folders.  `backend` handles backend builds and `frontend` is front for front end builds.  Pushes to `main` push directly to production.  

"I don't always test my code, but when I do, I do it in production."

## Devops
the `devops/deploy` folders also contain infrastructure for the infrastructure as code code to generate the infrastructure that runs the code. It's just code, all the way down.

The Devops infrastructure code is also Typescript, using the AWS CDK.

Front end code is compiled, and put in an S3 bucket which is fronted by a Cloudfront distribution.

Backend code is build into a Docker container, which is defined in the `Dockerfile`. This stuff RARELY changes, if ever.
