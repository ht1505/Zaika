import Order from "../models/Order.js";
import { parseOrderFromTranscript } from "../services/openaiService.js";
import {
  buildIncomingVoiceResponse,
  buildOrderConfirmationResponse,
  buildRetryVoiceResponse,
} from "../services/twilioService.js";
import { emitOrderCreated } from "../services/socketService.js";

const getBaseUrl = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto
    ? String(forwardedProto).split(",")[0]
    : req.protocol;

  return `${protocol}://${req.get("host")}`;
};

const getTranscriptionActionUrl = (req) => {
  if (process.env.TWILIO_TRANSCRIPTION_URL) {
    return process.env.TWILIO_TRANSCRIPTION_URL;
  }

  return `${getBaseUrl(req)}/api/voice/transcription`;
};

export const handleIncomingCall = async (req, res, next) => {
  try {
    const actionUrl = getTranscriptionActionUrl(req);
    const twiml = buildIncomingVoiceResponse({
      actionUrl,
      mediaStreamUrl: process.env.TWILIO_MEDIA_STREAM_URL
    });

    res.type("text/xml");
    return res.send(twiml.toString());
  } catch (error) {
    return next(error);
  }
};

export const handleTranscription = async (req, res, next) => {
  try {
    const actionUrl = getTranscriptionActionUrl(req);
    const transcript = String(
      req.body.SpeechResult ||
        req.body.TranscriptionText ||
        req.body.transcript ||
        "",
    ).trim();

    if (!transcript) {
      const twiml = buildRetryVoiceResponse({ actionUrl });
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    const phoneNumber = String(
      req.body.From || req.body.Caller || req.body.phone_number || "",
    ).trim();

    const parsedOrder = await parseOrderFromTranscript({
      transcript,
      phoneNumber,
    });

    const order = await Order.create({
      customerName: parsedOrder.customerName,
      customerPhone: parsedOrder.customerPhone,
      items: parsedOrder.items,
      rawTranscript: transcript,
      status: "received",
      estimatedTime: parsedOrder.estimatedTime,
    });

    emitOrderCreated(order);

    const twiml = buildOrderConfirmationResponse({ order });
    res.type("text/xml");

    return res.send(twiml.toString());
  } catch (error) {
    return next(error);
  }
};
