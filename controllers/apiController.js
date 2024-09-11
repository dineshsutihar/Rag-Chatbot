import { handleRequest } from "../services/documentService.js";
import { getCachedResponse, setCache } from "../services/redisService.js";

export const processRequest = async (req, res) => {
  const { context, question } = req.body;
  const cacheKey = `response:${context}:${question}`;
  const cachedResponse = await getCachedResponse(cacheKey);

  if (cachedResponse) {
    return res.json({ message: cachedResponse });
  }

  try {
    const response = await handleRequest(context, question);
    await setCache(cacheKey, response);
    res.json({ message: response });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "An error occurred" });
  }
};
