import axios from 'axios';
import { getAccessToken } from '../auth/authGraphApi.js';
import { uploadToSpace } from '../aws/s3.js';
import Papa from 'papaparse';

const BUCKET_NAME = process.env.BUCKET_NAME;

export const handleNotification = async function handleNotification(notification) {
  try {
    const event = notification.value[0];
    const meetingId = extractMeetingId(event.resource);
    const resourceId = event?.resourceData?.id;
    if (event.resource.includes('recordings')) {
      console.log('<===== Recording notification received: =====>');
      const meetingName = (await getMeetingSubject(meetingId)) || 'Unknown';
      const { callId, createdDateTime, recordingContentUrl, endDateTime } = await getMeetingDetails(meetingId, resourceId, 'recordings');
      await uploadMeetingAsset(meetingName, callId, createdDateTime, recordingContentUrl, 'recording');
      await downloadAndUploadMeetingAttendees(meetingName, meetingId, callId, createdDateTime, endDateTime);
    }

    if (event.resource.includes('transcripts')) {
      console.log('<===== New transcript notification: =====>');
      const meetingName = (await getMeetingSubject(meetingId)) || 'Unknown';
      const { callId, createdDateTime, transcriptContentUrl } = await getMeetingDetails(meetingId, resourceId, 'transcripts');
      await uploadMeetingAsset(meetingName, callId, createdDateTime, transcriptContentUrl, 'transcript');
    }

    if (event.resource.includes("chats('")) {
      console.log('<===== Call start/end notification: =====>');
      const chatId = extractChatId(event.resource);
      const messageId = event.resourceData.id;
      console.log('<===== Chat ID: =====>', chatId);
      console.log('<===== Message ID: =====>', messageId);
      await notifyCallStartEnd(chatId, messageId);
    }
  } catch (error) {
    console.error('<===== Error handling notification: =====>');
    console.error(error)
  }
}


const getMeetingSubject = async function getMeetingDetails(meetingId) {
  try {
    console.log('<===== Getting meeting details: =====>');
    const accessToken = await getAccessToken();
    const response = await axios.get(`${process.env['MICROSOFT_GRAPH_API']}/users/${process.env['MICROSOFT_USER_ID']}/onlineMeetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return response.data.subject;
  } catch (error) {
    console.error('<===== Error getting meeting details: =====>', error.response ? error.response.data : error.message);
    throw error;
  }
}


const getMeetingDetails = async function getMeetingDetails(meetingId, recordingId, eventType) {
  try {
    console.log('<===== Getting recording details: =====>');
    const accessToken = await getAccessToken();
    const response = await axios.get(`${process.env['MICROSOFT_GRAPH_API']}/users/${process.env['MICROSOFT_USER_ID']}/onlineMeetings/${meetingId}/${eventType}/${recordingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    console.log('<===== Recording details: =====>');
    return {
      callId: response.data.callId,
      createdDateTime: response.data.createdDateTime,
      recordingContentUrl: response.data.recordingContentUrl,
      transcriptContentUrl: response.data.transcriptContentUrl,
      endDateTime: response.data.endDateTime
    };
  } catch (error) {
    console.error('<===== Error getting recording details: =====>', error.response ? error.response.data : error.message);
    throw error;
  }
}

const downloadAndUploadMeetingAttendees = async function downloadAndUploadMeetingAttendees(meetingName, meetingId, callId, createdDateTime, endDateTime) {
  try {
    console.log('<===== Getting meeting attendees: =====>');
    const accessToken = await getAccessToken();
    const response = await axios.get(`${process.env['MICROSOFT_GRAPH_API']}/users/${process.env['MICROSOFT_USER_ID']}/onlineMeetings/${meetingId}/attendanceReports/${callId}/attendanceRecords`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const attendees = response.data.value;

    // Extract necessary data for the CSV
    const csvData = attendees.map((attendee) => ({
      emailAddress: attendee.emailAddress || 'N/A',
      displayName: attendee.identity.displayName,
    }));

    // Generate CSV content as string
    const csvContent = Papa.unparse(csvData);

    const csvKey = `meets/${meetingName}/${createdDateTime}/attendees.csv`;
    const csvPublicUrl = await uploadToSpace(BUCKET_NAME, csvKey, csvContent);
    console.log('CSV uploaded to S3 successfully. Public URL:', csvPublicUrl);
    console.log(`File uploaded to S3 successfully. Public URL:`, csvPublicUrl);

    const userDetails = JSON.parse(JSON.stringify(csvData));
    await notifyCallEvent(callId, endDateTime, 'end', userDetails);
  } catch (error) {
    console.error('<===== Error getting meeting attendees: =====>', error.response ? error.response.data : error.message);
    throw error;
  }
}

const uploadMeetingAsset = async function uploadMeetingAsset(
  meetingName,
  callId,
  createdDateTime,
  contentUrl,
  eventType
) {
  try {
    console.log(`<===== Downloading ${eventType}: =====>`);
    const accessToken = await getAccessToken();

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    let responseType = "stream";

    if (eventType === "transcript") {
      headers["Content-Type"] = "text/vtt";
      headers["Accept"] = "text/vtt";
      responseType = "text";
    }

    const response = await axios.get(contentUrl, {
      headers,
      responseType,
    });

    console.log(`<===== ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} downloaded: =====>`);

    const extension = eventType === "recording" ? "mp4" : "vtt";
    const key = `meets/${meetingName}/${createdDateTime}/${eventType}.${extension}`;

    const publicUrl = await uploadToSpace(BUCKET_NAME, key, response.data);
    console.log(`File uploaded to S3 successfully. Public URL:`, publicUrl);

    return publicUrl;
  } catch (error) {
    console.error(
      `<===== Error downloading ${eventType}: =====>`,
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};


const notifyCallStartEnd = async function notifyCallStartEnd(chatId, messageId) {
  try {
    console.log('<===== Call start/end notification received: =====>');
    const accessToken = await getAccessToken();
    const response = await axios.get(`${process.env['MICROSOFT_GRAPH_API']}/chats/${chatId}/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    const responseData = response.data;
    if (responseData?.eventDetail['@odata.type']?.includes('callStarted')) {
      console.log('<===== Call started: =====>');
      await notifyCallEvent(responseData.eventDetail.callId, new Date(responseData.createdDateTime), 'start');
    }
  } catch (error) {
    console.error('<===== Error getting call details: =====>', error.response ? error.response.data : error.message);
    throw error;
  }
}

const notifyCallEvent = async function notifyCallEvent(callId, endDateTime, event, userDetails,) {
  try {
    console.log('<===== Notifying call event: =====>');
    let params = {
      msg: event,
      DateTime: endDateTime,
      id: callId,
    }
    if (event === 'end') {
      params = {
        ...params,
        userDetails,
      }
    }
    console.log(params)
    /**
     * TODO once we get the server details we can use the below code to notify the call event
     */
    // const response = await axios.post(`${process.env['SERVER_URL']}/bot`,
    //   params
    // );
    console.log('<===== Call event notified: =====>');
    // console.log(response.data);
  } catch (error) {
    console.error('<===== Error notifying call event: =====>', error.response ? error.response.data : error.message);
    throw error;
  }
}

function extractChatId(inputString) {
  const match = inputString.match(/chats\('([^']+)'\)/);
  return match ? match[1] : null; // Return the match or null if no match is found
}

function extractMeetingId(inputString) {
  const match = inputString.match(/communications\/onlineMeetings\('([^']+)'\)/);
  return match ? match[1] : null; // Return the match or null if no match is found
}
