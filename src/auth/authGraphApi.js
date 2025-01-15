import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

let tokenExpirationTime = null;
let accessToken = null;

export const graphClient = async function graphClient() {
  return await createGraphClient();
}

const createGraphClient = async function createGraphClient() {
  try {
    console.log('<===== Creating graph client: =====>');
    const accessToken = await getAccessToken();
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  } catch (error) {
    console.error('<===== Error creating graph client: =====>', error);
    throw error;
  }
}

export const getAccessToken = async function getAccessToken() {
  try {
    if (tokenExpirationTime && new Date(tokenExpirationTime) >= new Date()) {
      console.log('<===== Access token available: =====>');
      return accessToken
    }

    const tokenRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const cca = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
      },
    });
    const response = await cca.acquireTokenByClientCredential(tokenRequest);
    console.log('<===== Access token acquired: =====>');
    tokenExpirationTime = response.expiresOn;
    accessToken = response.accessToken;
    return accessToken;
  } catch (error) {
    console.error('<===== Error acquiring token: =====>', error);
    throw error;
  }
}
