import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cron from 'node-cron';

import { createSubscriptionForTranscript } from './src/subscription/transcript.js';
import { createSubscriptionForRecording } from './src/subscription/recording.js';
import { deleteExistingSubscriptions } from './src/subscription/deleteSubscriptions.js';
import { handleNotification } from './src/subscription-notifications/handleNotification.js';
import { createSubscriptionForMeeting } from './src/subscription/meetingSubscription.js';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
morgan(':method :url :status :res[content-length] - :response-time ms')
app.use(morgan('dev'));

app.use((err, req, res) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  process.exit(1);
});


async function createSubscription() {
  /**
   * TODO: Create a cron/scheduler to renew the Microsoft subscription
   */
  try {
    console.log('Deleting existing subscriptions...');
    await deleteExistingSubscriptions();
    console.log('Existing subscriptions deleted.');

    console.log('Creating new subscriptions...');
    await Promise.all([
      createSubscriptionForTranscript(),
      createSubscriptionForRecording(),
      createSubscriptionForMeeting(),
    ]);
    console.log('All subscriptions created successfully.');
  } catch (error) {
    console.error('<===== Error creating subscription: =====>', error.message, error.stack);
  }
}

// Schedule the job to run every 55 minutes
cron.schedule('*/55 * * * *', () => {
  console.log('Running subscription renewal process...');
  createSubscription().catch(console.error);
});

app.post('/notificationClient', (req, res) => {
  const notification = req.body;
  console.log(JSON.stringify(req.body))
  if (notification.value && notification.value[0].resourceData) {
    console.log('Received notification:', notification.value[0].resource);
    handleNotification(notification);
  }
  res.status(200).send(req.query.validationToken);
});

app.listen(process.env.PORT, async () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    await createSubscription()
})