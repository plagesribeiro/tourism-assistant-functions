/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {Response, Request} from "express";
import {openai} from "../services/openai";
import {supabase} from "../services/supabase";

const GLOBAL_ERROR_MSG = "Server Error -> Recommender Endpoint -> ";

const groupReviews = (reviews: any[]) => {
  const group: { [key: string]: any } = {};

  reviews.forEach((review) => {
    const {place_id, url, id, content, similarity} = review;

    if (!group[place_id]) {
      group[place_id] = {
        place_id,
        url,
        reviewCount: 0,
        average_similarity: 0,
        reviews: [],
      };
    }

    group[place_id].reviews.push({id, content, similarity});
    group[place_id].reviewCount += 1;
    group[place_id].average_similarity += similarity;
  });

  // Calculate the average similarity
  Object.values(group).forEach((data) => {
    data.average_similarity /= data.reviewCount;
  });

  return Object.values(group);
};

const sortReviews = (group: any[]) => {
  return group.sort((a, b) => {
    if (a.reviewCount !== b.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }
    return b.average_similarity - a.average_similarity;
  });
};

export const embeddingSearch = async (req: Request, res: Response) => {
  const LOCAL_ERROR_MSG = GLOBAL_ERROR_MSG+"embeddingSearch() -> ";

  try {
    const inputBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!inputBody.userDescription || typeof inputBody.userDescription !== "string") throw new Error("Missing or invalid userDescription parameter");

    const embedding = await openai.getEmbedding(inputBody.userDescription);

    if (embedding?.length === 1536 && supabase) {
      const {data} = await supabase.rpc("match_reviews_with_place_ids", {
        query_embedding: embedding,
        place_ids: inputBody.placeIds,
        similarity_threshold: 0.8,
        match_count: 1000,
      });

      const dataArray = Object.values(data);
      const groupedData = groupReviews(dataArray);
      const sortedReviews = sortReviews(groupedData);

      res.json(sortedReviews);
      return;
    }

    res.json({message: "No data returned"});
  } catch (e: any) {
    const error = {error: LOCAL_ERROR_MSG+(e.message || "Unknown error")};
    console.error(error);
    res.status(500).json(error);
  }
};
