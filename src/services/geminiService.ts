import axios from "axios";
import { ENV } from "../config/env.config";
import logger from "../config/logger.config";

/**
 * Uses Google Gemini Flash to extract actionable steps from doctor notes.
 * @param note - The doctor's note text.
 * @returns An object containing `checklist` and `plan` arrays.
 */
export const generateActionableSteps = async (note: string): Promise<{ checklist: string[]; plan: string[] }> => {
  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Extract structured actionable steps from this medical note:\n\n"${note}"
              
              - **Checklist:** Immediate one-time tasks (e.g., buy a drug).
              - **Plan:** Scheduled actions (e.g., take a drug daily for 7 days).
              
              Format the response as **valid JSON** like this:
              {
                "checklist": ["task1", "task2"],
                "plan": ["scheduled action1", "scheduled action2"]
              }
              Do **NOT** include any additional text or formatting, just the JSON object.`
            }
          ]
        }
      ]
    };

    logger.info("📡 Sending request to Gemini AI for actionable steps...");

    const response = await axios.post(API_URL, requestBody, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000, // ⏳ Set timeout to 10s to prevent hanging
    });

    // ✅ Validate response structure
    if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
      logger.warn("⚠️ Gemini AI returned an empty response.");
      return { checklist: [], plan: [] };
    }

    let outputText = response.data.candidates[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      logger.warn("⚠️ Gemini AI response missing text content.");
      return { checklist: [], plan: [] };
    }

    // ✅ Remove backticks and clean up the response
    outputText = outputText.replace(/```json\n?|\n```/g, "").trim();

    // ✅ Try to parse AI response safely
    try {
      const parsedResponse = JSON.parse(outputText);

      if (!parsedResponse.checklist || !parsedResponse.plan) {
        logger.warn("⚠️ Gemini AI returned an unexpected format.");
        return { checklist: [], plan: [] };
      }

      logger.info("✅ Successfully parsed actionable steps from Gemini AI:", parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      logger.error("❌ Failed to parse AI response as JSON.", { error: parseError, rawResponse: outputText });
      return { checklist: [], plan: [] };
    }
  } catch (error: any) {
    logger.error("❌ Error generating actionable steps from Gemini AI:", { error: error.message });
    
    if (error.response) {
      logger.error("🛑 API Response Error:", { status: error.response.status, data: error.response.data });
    }

    return { checklist: [], plan: [] };
  }
};
