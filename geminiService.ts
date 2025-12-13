import { GoogleGenAI, Type } from "@google/genai";

// Safely access process.env
const getApiKey = () => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  } catch (e) {
    console.warn("API Key access failed", e);
    return '';
  }
};

const apiKey = getApiKey();
// Only initialize if key exists, otherwise handle gracefully later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const modelName = 'gemini-2.5-flash';

/**
 * Generates a professional job description based on basic inputs.
 */
export const generateJobDescription = async (
  title: string,
  location: string,
  keywords: string
): Promise<string> => {
  if (!ai) return "API Key 未配置，无法生成内容。";
  
  try {
    const prompt = `
      Create a professional job description (in Chinese) for a "${title}" position located in "${location}".
      Key requirements/keywords provided: ${keywords}.
      
      Structure the response with these sections clearly formatted:
      1. 职位概要 (Job Summary)
      2. 主要职责 (Key Responsibilities) - Bullet points
      3. 任职要求 (Requirements) - Bullet points
      4. 福利待遇 (Benefits) - If applicable based on general standards in Myanmar.
      
      Keep the tone professional, encouraging, and suitable for the Myanmar job market.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text || "无法生成描述，请重试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成职位描述时发生错误，请检查网络。";
  }
};

/**
 * Analyzes a user's resume/bio text and suggests matching job roles or categories.
 */
export const analyzeResumeAndMatch = async (resumeText: string): Promise<{
  summary: string;
  suggestedRoles: string[];
  advice: string;
}> => {
  if (!ai) {
      return {
          summary: "API Key 未配置",
          suggestedRoles: [],
          advice: "无法连接 AI 服务"
      };
  }

  try {
    const prompt = `
      Act as a career consultant for the Myanmar job market.
      Analyze the following resume/bio text (which might be in Chinese or Burmese):
      "${resumeText}"

      Return a JSON object with:
      1. 'summary': A 1-sentence summary of the candidate's profile in Chinese.
      2. 'suggestedRoles': An array of 3-5 specific job titles (in Chinese) that fit their skills best.
      3. 'advice': 1-2 sentences of career advice for them in Chinese.

      Output JSON only.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestedRoles: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            advice: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Match Error:", error);
    return {
      summary: "无法分析简历。",
      suggestedRoles: ["通用文员", "销售助理"],
      advice: "请尝试提供更详细的信息。"
    };
  }
};