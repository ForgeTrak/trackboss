const fs = require('fs');

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const region = process.env.AWS_REGION || 'us-east-1';

const sns = new SNSClient({ region });
const ses = new SESClient({ region });

exports.handler = async function (event) {
  console.log(JSON.stringify(event));
  const notificationMessage = JSON.parse(event.Records[0].body);
  const { members, mechanism, subject } = notificationMessage;
  let { text } = notificationMessage;

  console.log(`there are ${members.length} recipients.`);

  if (mechanism === 'TEXT') {
    console.log('Trackboss messaging lambda - starting text messages');

    for (const member of members) {
      try {
        await sns.send(
          new PublishCommand({
            PhoneNumber: member.phone,
            Message: text,
            MessageAttributes: {
              'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Promotional' },
              'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'PRA-Hogback' },
            },
          })
        );

        console.log(`publishing to ${member.phone}`);
      } catch (error) {
        console.error('Trackboss messaging lambda - unable to send message', error);
      }
    }

    console.log(`Trackboss messaging lambda - sent to ${members.length} recipients`);
    return;
  }

  if (mechanism === 'EMAIL') {
    console.log('Trackboss messaging lambda - sending an email message');

    const memberRecipients = [];
    for (const member of members) {
      if (member.email) memberRecipients.push(member.email);
    }
    console.log(`Trackboss messaging lambda - added ${memberRecipients.length}`);

    let template = fs.readFileSync('./emailtemplate.html', 'utf8');
    template = template.replace(/PRA_NOTIFICATION_TITLE/g, subject);
    template = template.replace('PRA_NOTIFICATION_BODY', text);
    template = template.replace('PRA_NOTIFICATION_SEND_TIME', new Date().toISOString());

    for (const recipient of memberRecipients) {
      const emailParams = {
        Destination: {
          ToAddresses: [recipient],
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: template,
            },
          },
        },
        ReplyToAddresses: ['hogbacksecretary@gmail.com'],
        Source: 'admin@palmyramx.com',
      };

      try {
        await ses.send(new SendEmailCommand(emailParams));
        console.log(`Trackboss messaging lambda - sent email to ${recipient}`);
      } catch (error) {
        console.error('Trackboss messaging lambda - Unable to send email via SES', error);
      }
    }
  }
};
