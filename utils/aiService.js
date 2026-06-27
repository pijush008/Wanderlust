/**
 * ================= AI SERVICE (OpenAI GPT) =================
 * 
 * Integrates OpenAI for:
 *   1. Travel Assistant Chatbot — natural language trip advice
 *   2. Smart Search — understand user intent from natural language
 *   3. Review Summarization — condense reviews into key insights
 *   4. Listing Description Generator — help hosts write better descriptions
 */

const OpenAI = require("openai");

let openai = null;

// ================= INITIALIZE =================
function initializeAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log(" AI Service: Disabled (no OPENAI_API_KEY)");
    return false;
  }

  try {
    openai = new OpenAI({ apiKey });
    console.log(" AI Service: OpenAI GPT initialized");
    return true;
  } catch (err) {
    console.error(" AI Service: Init failed —", err.message);
    return false;
  }
}

// ================= TRAVEL ASSISTANT CHATBOT =================
async function travelAssistant(userMessage, context = {}) {
  if (!openai) return { reply: "AI service is not available.", error: true };

  const systemPrompt = `You are WanderBot, an AI travel assistant for Wanderlust — an Indian travel booking platform similar to Airbnb.

Your role:
- Help users plan trips across India
- Suggest destinations, stays, and activities
- Answer questions about travel, budget, best times to visit
- Be friendly, concise, and helpful
- Use ₹ for prices (Indian Rupees)
- Keep responses under 200 words unless the user asks for detail

Available destinations: Manali, Goa, Jaipur, Udaipur, Rishikesh, Darjeeling, Ooty, Alleppey, Kasol, Mussoorie, Mumbai, Pondicherry, Jaisalmer, Jodhpur, Coorg, Andaman, Leh, Jim Corbett, Gulmarg, Shimla.

Price ranges: Budget (₹800-1500/night), Mid (₹1500-3000), Premium (₹3000-5000), Luxury (₹5000+)

${context.listings ? `\nRelevant listings on our platform:\n${context.listings}` : ""}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || "I couldn't generate a response.";
    return { reply, error: false };
  } catch (err) {
    console.error("AI Travel Assistant error:", err.message);
    if (err.status === 429) {
      return { reply: "I'm getting too many requests. Please try again in a moment! 🕐", error: true };
    }
    if (err.status === 401) {
      return { reply: "AI service authentication failed. Please check the API key.", error: true };
    }
    return { reply: "Sorry, I couldn't process that right now. Try again.", error: true };
  }
}

// ================= REVIEW SUMMARIZATION =================
async function summarizeReviews(reviews) {
  if (!openai || reviews.length < 3) return null;

  const reviewText = reviews
    .slice(0, 20)
    .map((r, i) => `${r.rating}★: ${r.comment}`)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Summarize guest reviews in 3-4 bullet points. Highlight positives, concerns, and who the place is best for. Be concise.",
        },
        { role: "user", content: reviewText },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || null;
  } catch (err) {
    console.error("Review summarization error:", err.message);
    return null;
  }
}

// ================= SMART SEARCH INTENT =================
async function parseSearchIntent(query) {
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Parse travel search queries into JSON filters. Return ONLY valid JSON.
Fields: location, category (mountains|beaches|castles|camping|farms|homes|boats|iconic_cities|rooms|domes), maxPrice (number), minPrice (number), tripType (friends|couple|family|solo|adventure), familyFriendly (bool), petFriendly (bool), keywords (array).`,
        },
        { role: "user", content: query },
      ],
      max_tokens: 150,
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Search intent parsing error:", err.message);
    return null;
  }
}

// ================= LISTING DESCRIPTION GENERATOR =================
async function generateDescription(listingInfo) {
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Write a compelling 2-3 sentence listing description for a travel stay. Make it inviting and highlight the location. Under 50 words.",
        },
        {
          role: "user",
          content: `Title: ${listingInfo.title}, Location: ${listingInfo.location}, ${listingInfo.country}, Price: ₹${listingInfo.price}/night, Category: ${listingInfo.category || "home"}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || null;
  } catch (err) {
    console.error("Description generation error:", err.message);
    return null;
  }
}

// ================= EXPORTS =================
module.exports = {
  initializeAI,
  travelAssistant,
  summarizeReviews,
  parseSearchIntent,
  generateDescription,
};
