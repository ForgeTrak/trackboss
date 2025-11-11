# clubmanager-2.0

## Setting Up the Server

In order for the server to function, it requires a `.env` file at the top level of the project. The file requires the following values at a minimum:

- `COGNITO_POOL_ID`
  - This variable is the pool ID of the Cognito user pool that the authentication subsystem will be using to authenticate
- `COGNITO_CLIENT_ID`
  - This variable is the client ID for the Cognito app that is registered for the user pool supplied above
- `MYSQL_DB`
  - This variable is the name of the database the server will be interacting with
  - For development, we've been using `pradb`
- `MYSQL_HOST`
  - This variable is the name of the database's host
  - For development, we've been using `localhost`
- `MYSQL_USER`
  - This variable is the name of the user to interact with the database
  - For development, we've been using `dev`
- `MYSQL_PASS`
  - This variable is the password of the user to interact with the database
  - For development, we've been using `devpass`

Additionally, the following values are optional:

- `PORT`
  - The port the server will be listening on
  - Default: `8080`
- `MYSQL_CONN_LIMIT`
  - The maximum number of active connections the server can maintain with the database at any one time
  - Default: `10`
- `MYSQL_QUEUE_LIMIT`
  - The maximum number of server tasks that can wait for an active connection to the database if they are all in use
  - Default: `0` (which in this case actually means "unlimited" - see [here](https://github.com/mysqljs/mysql#pool-options))

## Releases
For all pushes to main, release builds are automatically created via a GitHub Actions Workflow. These artifacts can always be accessed via the Actions tab in the repository. For more details, see [this documentation](https://docs.github.com/en/actions/managing-workflow-runs/downloading-workflow-artifacts). Additionally, production artifacts can also be found at [nightly.link](nightly.link/Squeaky-Training-Wheels/clubmanager-2.0/workflows/main.yml/main). These links bypass the requirement for being logged into GitHub to obtain an artifact, and will always point to the most recent run of the workflow.

## Licensing
This project is licensed under the Business Source License 1.1.
For commercial use, contact ForgeTrak, LLC