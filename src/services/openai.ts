import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const openaiClient = new OpenAI({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});

const positivenessRating = async (text: string) => {
  try {
    const responseOpenai = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: `Classify the comment responding with a number between 0 and 1. 
      Being 0 a very negative comment and being 1 a very positive comment. The comment is: ${text}`}],
    });

    if (!responseOpenai || !responseOpenai.choices || !responseOpenai.choices[0] || !responseOpenai.choices[0].message || !responseOpenai.choices[0].message.content) {
      throw new Error("Internal Server Error");
    }

    const classification = parseFloat(responseOpenai.choices[0].message.content.replace(/[^0-9,.]+/g, "").replace(",", "."));
    if (isNaN(classification)) {
      throw new Error("Internal Server Error");
    }

    return classification;
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
};

const usefulnessRating = async (text: string) => {
  try {
    const responseOpenai = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: `Classify the comment responding with a number between 0 and 1. 
      Being 0 a very useless comment (not relevant, or exceptions) 
      and being 1 a very useful (relevant, doesn't matter if positive or negative, but it is a important thing to know) 
      comment. The comment is: ${text}`}],
    });

    if (!responseOpenai || !responseOpenai.choices || !responseOpenai.choices[0] || !responseOpenai.choices[0].message || !responseOpenai.choices[0].message.content) {
      throw new Error("Internal Server Error");
    }

    const classification = parseFloat(responseOpenai.choices[0].message.content.replace(/[^0-9,.]+/g, "").replace(",", "."));

    if (isNaN(classification)) {
      throw new Error("Internal Server Error");
    }

    return classification;
  } catch (error) {
    console.error(error);
    throw new Error("Internal Server Error");
  }
};

const getEmbedding = async (text: string) => {
  const embedding = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
};

// Arrow function to calculate the dot product of two vectors
const dotProduct = (vecA: number[], vecB: number[]): number =>
  vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);

// Arrow function to calculate the norm (magnitude) of a vector
const vectorNorm = (vec: number[]): number =>
  Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));

// Arrow function to calculate the cosine similarity between two vectors
const getEmbeddingsSimilarity = (vecA: number[], vecB: number[]): number =>
  dotProduct(vecA, vecB) / (vectorNorm(vecA) * vectorNorm(vecB));

export const openai = {
  positivenessRating,
  usefulnessRating,
  getEmbedding,
  getEmbeddingsSimilarity,
};
