# Onboarding

## Things to run locally

To set up this project you will need:
* Node JS (I use nvm to make things easier).  I use Node 24.
* MySQL (Production is using version 8.4)
    * Locally via homebrew install or Docker (I run homebrew but had bad luck with docker and MySql being irrepably broken)
    * You'll need a mysql user with DB privileges to create schema and do DDL.
    * Create a schema in the DB called `forgetrak`
    * if you get stuck on this step we can also use a shared RDS.
* AWS CLI
* AWS access key for ForgeTrak AWS account.  You can create this from https://forgetrak.awsapps.com/start using your login.  Or from the IAM console.  Using your login access level will work.
* MySQL Workbench (this is optional, but really handy for viewing your databse locally and in production when needed)
`brew install --cask mysqlworkbench`
* .env file that looks like this:
````
MYSQL_DB=forgetrak
MYSQL_HOST=localhost
MYSQL_USER=dev
MYSQL_PASS=
AWS_REGION=us-east-1
````
* Your mysql user should have all privileges on the schema.  You can use the root user if you want, I created one for mine.  I create mine via MySQLWorkbench but you can do them via command line too.
* A mysql data dump file (I'll provide this)

Your access key will handle getting access to AWS resources, including those stored in Parameter Store and Secrets Manger.  The builds handle the rest.

## Steps to get running
* Clone this repo: `git clone https://github.com/ForgeTrak/trackboss.git`
* `npm install`
* Copy the dumpfile to your git repo's root folder as seeddump.sql IE: `cp ~/dumps/Dump20260326.sql seeddump.sql`
* `source .env`
* `npm run run-migrations` - this gets the database's default (and latest) state
* `npm run seed-db` - this loads a reliable data set.
* `npm run dev` - this starts up both front end and back end on 3000 / 8080.
