import OpenAI from "openai";

let cachedClient;

const getOpenAIClient = () => {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  cachedClient = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  return cachedClient;
};

const safeJsonParse = (input) => {
  if (!input || typeof input !== "string") {
    return null;
  }

  try {
    return JSON.parse(input);
  } catch (_error) {
    return null;
  }
};

const normalizeParsedOrder = (parsed, fallbackPhone) => {
  const items = Array.isArray(parsed?.items)
    ? parsed.items
        .map((item) => ({
          name: String(item?.item_name || item?.name || "").trim(),
          quantity: Number(item?.quantity) > 0 ? Number(item.quantity) : 1,
          specialInstructions: String(
            item?.special_instructions || item?.specialInstructions || "",
          ).trim(),
        }))
        .filter((item) => item.name.length > 0)
    : [];

  return {
    customerName:
      String(
        parsed?.customer_name || parsed?.customerName || "Guest Caller",
      ).trim() || "Guest Caller",
    customerPhone:
      String(
        parsed?.phone_number ||
          parsed?.customerPhone ||
          fallbackPhone ||
          "Unknown",
      ).trim() || "Unknown",
    estimatedTime:
      Number(parsed?.estimated_time_minutes) >= 0
        ? Number(parsed.estimated_time_minutes)
        : 30,
    items,
  };
};

const fallbackParse = (transcript, phoneNumber) => {
  return {
    customerName: "Guest Caller",
    customerPhone: phoneNumber || "Unknown",
    estimatedTime: 30,
    items: [
      {
        name: transcript.slice(0, 120),
        quantity: 1,
        specialInstructions: "",
      },
    ],
  };
};

export const parseOrderFromTranscript = async ({ transcript, phoneNumber }) => {
  if (!transcript || !transcript.trim()) {
    throw new Error("Transcript is empty");
  }

  const client = getOpenAIClient();

  if (!client) {
    return fallbackParse(transcript, phoneNumber);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o";

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "restaurant_order",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              customer_name: { type: "string" },
              phone_number: { type: "string" },
              estimated_time_minutes: { type: "number" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    item_name: { type: "string" },
                    quantity: { type: "number" },
                    special_instructions: { type: "string" },
                  },
                  required: ["item_name", "quantity", "special_instructions"],
                },
              },
            },
            required: [
              "customer_name",
              "phone_number",
              "estimated_time_minutes",
              "items",
            ],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You extract restaurant orders from transcribed phone calls. Return strict JSON only using the schema. Break multi-item orders into separate items, preserve quantities, and keep special instructions concise.",
        },
        {
          role: "user",
          content: `Transcript: ${transcript}\nCaller phone: ${phoneNumber || "unknown"}`,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;
    const parsed = safeJsonParse(content);

    if (!parsed) {
      return fallbackParse(transcript, phoneNumber);
    }

    const normalized = normalizeParsedOrder(parsed, phoneNumber);

    if (!normalized.items.length) {
      return fallbackParse(transcript, phoneNumber);
    }

    return normalized;
  } catch (error) {
    console.error("OpenAI parsing failed:", error.message);
    return fallbackParse(transcript, phoneNumber);
  }
};
