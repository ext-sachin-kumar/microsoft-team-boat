import { graphClient } from "../auth/authGraphApi.js";

export const deleteExistingSubscriptions = async function deleteExistingSubscriptions() {
  try {
      const client = await graphClient();
      const subscriptions = await client.api('/subscriptions').get();

      const subscriptionsToDelete = subscriptions.value.filter(subscription =>
          subscription.resource === '/communications/onlineMeetings/getAllRecordings'
          || subscription.resource === '/communications/onlineMeetings/getAllTranscripts'
          || subscription.resource === '/chats/getAllMessages'
      );
      
      for (const subscription of subscriptionsToDelete) {
          console.log(`<===== Deleting subscription: ${subscription.id, subscription.resource} =====>`);
          await client.api(`/subscriptions/${subscription.id}`).delete();
          console.log(`<===== Deleted subscription: ${subscription.id} =====>`);
      }
  } catch (error) {
      console.error(
          '<===== Error deleting subscriptions: =====>',
          error.response ? error.response.data : error.message
      );
  }
}