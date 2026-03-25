import twilio from 'twilio';

const { VoiceResponse } = twilio.twiml;

export const buildIncomingVoiceResponse = ({ actionUrl, mediaStreamUrl }) => {
  const twiml = new VoiceResponse();

  if (mediaStreamUrl) {
    const start = twiml.start();
    start.stream({
      url: mediaStreamUrl,
      track: 'inbound_track'
    });
  }

  twiml.say(
    {
      voice: 'Polly.Joanna'
    },
    'Welcome to Zaika Restaurant. Please tell us your complete order after the beep. Include your name and any special instructions.'
  );

  const gather = twiml.gather({
    input: ['speech'],
    action: actionUrl,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
    enhanced: true
  });

  gather.say('Please start speaking now.');

  twiml.say('Sorry, we did not receive your order. Let us try again.');
  twiml.redirect({ method: 'POST' }, actionUrl.replace('/transcription', '/incoming'));

  return twiml;
};

export const buildRetryVoiceResponse = ({ actionUrl }) => {
  const twiml = new VoiceResponse();

  twiml.say('Sorry, we could not hear you clearly. Please repeat your order after the beep.');

  const gather = twiml.gather({
    input: ['speech'],
    action: actionUrl,
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
    enhanced: true
  });

  gather.say('Please repeat your order now.');

  twiml.say('We are unable to capture the order. Please call again in a moment.');
  twiml.hangup();

  return twiml;
};

export const buildOrderConfirmationResponse = ({ order }) => {
  const twiml = new VoiceResponse();

  const itemsSummary = order.items
    .map((item) => `${item.quantity} ${item.name}${item.specialInstructions ? ` with ${item.specialInstructions}` : ''}`)
    .join(', ');

  twiml.say(
    {
      voice: 'Polly.Joanna'
    },
    `Thank you ${order.customerName}. Your order ${order.orderId} has been received. Items: ${itemsSummary}. Estimated preparation time is ${order.estimatedTime} minutes.`
  );

  twiml.say('You can track this order from our website. Goodbye.');
  twiml.hangup();

  return twiml;
};
