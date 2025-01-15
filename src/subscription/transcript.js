import { graphClient } from '../auth/authGraphApi.js';

export const createSubscriptionForTranscript = async function createSubscriptionForTranscript() {
  try {
    const client = await graphClient();
    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 1);

    const subscriptionData = {
      changeType: 'created',
      notificationUrl: `${process.env.NOTIFICATION_URL}/notificationClient`,
      lifecycleNotificationUrl: `${process.env.NOTIFICATION_URL}/notificationClient`,
      resource: '/communications/onlineMeetings/getAllTranscripts',
      expirationDateTime: expirationDateTime.toISOString(),
    };

    const response = await client.api('/subscriptions').post(subscriptionData);

    console.log('<====== Subscription created successfully: ====>', response.id, response.resource);
  } catch (error) {
    console.error(
      '<===== Error creating subscription: =====>',
      error.response ? error.response.data : error.message
    );
  }
}