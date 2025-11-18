
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// Note: Assuming process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getOracleWisdom = async (levelName: string, lives: number, score: number): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are the "Oracle of the Bitverse", a mystical character in a retro pixel-art platformer game.
    The player has paused the game to ask for guidance.
    
    Current State:
    - Level: ${levelName}
    - Lives: ${lives}
    - Score: ${score}
    
    Provide a short, cryptic, but helpful hint or a piece of "ancient lore" about the game world.
    Keep it under 20 words. Use uppercase letters to simulate 8-bit text. 
    Be encouraging but mysterious.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "THE STATIC INTERFERES... TRY AGAIN.";
  } catch (error) {
    console.error("Oracle connection failed:", error);
    return "THE ORACLE IS SLEEPING. (CONNECTION ERROR)";
  }
};
