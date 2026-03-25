import express from "express";
import twilio from "twilio";

import {
  handleIncomingCall,
  handleTranscription,
} from "../controllers/voiceController.js";

const router = express.Router();

const validateTwilioSignature = (req, res, next) => {
  const shouldValidate = process.env.TWILIO_VALIDATE_REQUEST === "true";

  if (!shouldValidate) {
    return next();
  }

  const validatorMiddleware = twilio.webhook({
    validate: true,
    protocol: process.env.TWILIO_WEBHOOK_PROTOCOL || undefined,
  });

  return validatorMiddleware(req, res, next);
};

router.post("/incoming", validateTwilioSignature, handleIncomingCall);
router.post("/transcription", validateTwilioSignature, handleTranscription);

export default router;
