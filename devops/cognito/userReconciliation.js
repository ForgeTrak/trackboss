/* eslint-disable @typescript-eslint/no-var-requires */
const AWS = {}; // require('aws-sdk');
const mysql = require('mysql2');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' }); // Update with your region
const cognito = new AWS.CognitoIdentityServiceProvider();

// MySQL database configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
};

const mysqlConnection = mysql.createConnection(mysqlConfig);

const listUsers = async (userPoolId) => {
  const limit = 50; // Adjust as needed based on your user pool size and API limits
  let paginationToken = null;
  let notValidInDb = [];
  do {
    try {
      const params = {
        UserPoolId: userPoolId,
        Limit: limit,
        PaginationToken: paginationToken,
      };

      // eslint-disable-next-line no-await-in-loop
      const data = await cognito.listUsers(params).promise();

      // Extract email addresses from the response
      const emailAddresses = data.Users.map((user) => {
        const emailAttribute = user.Attributes.find((attr) => attr.Name === 'email');
        return emailAttribute ? emailAttribute.Value : null;
      }).filter(Boolean);

      // Look up email addresses in MySQL database

      // eslint-disable-next-line no-restricted-syntax
      for (const emailAddress of emailAddresses) {
        try {
          const query = 'SELECT email FROM member WHERE email = ? and active = 1 and email != \'apiuser@palmyramx.com\'';
          // eslint-disable-next-line no-await-in-loop
          const results = await new Promise((resolve, reject) => {
            mysqlConnection.query(query, [emailAddress], (error, dbResults) => {
              if (error) {
                reject(error);
              } else {
                resolve(dbResults);
              }
            });
          });
          if (results && results.length === 0) {
            // console.log(`email ${emailAddress} not found in mysql but in cognitio`);
            notValidInDb.push(emailAddress);
          } else {
            // console.log('Found matching email in MySQL:', results);
          }
          // Do something with the results
        } catch (error) {
          console.error('Error querying MySQL:', error);
        }
      }

      // Get pagination token for next page
      paginationToken = data.PaginationToken;
    } catch (error) {
      console.error('Error listing users:', error);
      break;
    }
  } while (paginationToken);
  mysqlConnection.end();
  console.log(`${notValidInDb.length} users found`);
  notValidInDb = notValidInDb.filter((email) => (email !== 'apiuser@palmyramx.com'));
  notValidInDb.sort();
  notValidInDb.forEach((email) => console.log(email));
};

// Call listUsers function with your user pool ID
listUsers(process.env.COGNITO_POOL_ID).then(); // Update with your user pool ID
