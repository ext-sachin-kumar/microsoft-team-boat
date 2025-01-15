import { graphClient } from '../auth/authGraphApi.js';

export const createSubscriptionForMeeting = async function createSubscriptionForMeeting() {
  try {
    const client = await graphClient();
    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 1);

    const subscriptionData = {
      changeType: 'created,updated',
      notificationUrl: `${process.env.NOTIFICATION_URL}/notificationClient`,
      lifecycleNotificationUrl: `${process.env.NOTIFICATION_URL}/notificationClient`,
      resource: `/chats/getAllMessages`,
      expirationDateTime: expirationDateTime.toISOString(),
    };

    const response = await client.api('/subscriptions').post(subscriptionData);

    console.log('<====== Subscription created successfully: ====>', response.id, response.resource);
  } catch (error) {
    console.log(error)
    console.error(
      '<===== Error creating subscription: =====>',
      error.response ? error.response.data : error.message
    );
  }
}