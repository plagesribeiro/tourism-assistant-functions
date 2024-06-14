/* eslint-disable @typescript-eslint/no-explicit-any */
import {Response, Request} from "express";
import {maps} from "../services/maps";
import {openai} from "../services/openai";
import {seedReviewsInputBodySchema} from "../schema/maps";
import {formatZodError} from "../schema/formater";
import {z} from "zod";
import {supabase} from "../services/supabase";

const GLOBAL_ERROR_MSG = "Server Error -> Maps Endpoint -> ";


export const getPredictions = async (req: Request, res: Response) => {
  const LOCAL_ERROR_MSG = GLOBAL_ERROR_MSG+"getPredictions() -> ";

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body.input || typeof body.input !== "string") throw new Error("Missing or invalid input parameter");

    const data = await maps.getPredictions({input: body.input});
    res.json(data);
  } catch (e: any) {
    const error = {error: LOCAL_ERROR_MSG+(e.message || "Unknown error")};
    console.error(error);
    res.status(500).json(error);
  }
};

export const getPlaceDetails = async (req: Request, res: Response) => {
  const LOCAL_ERROR_MSG = GLOBAL_ERROR_MSG+"getPlaceDetails() -> ";

  try {
    const inputBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!inputBody.placeId || typeof inputBody.placeId !== "string") throw new Error("Missing or invalid placeId parameter");

    const data = await maps.getPlaceDetails({placeId: inputBody.placeId});
    res.json(data);
  } catch (e: any) {
    const error = {error: LOCAL_ERROR_MSG+(e.message || "Unknown error")};
    console.error(error);
    res.status(500).json(error);
  }
};

export const seedReviews = async (
  req: Request, res: Response
) => {
  const LOCAL_ERROR_MSG = GLOBAL_ERROR_MSG+"seedReviews() -> ";
  try {
    const inputBody = seedReviewsInputBodySchema.parse(typeof req.body === "string" ? JSON.parse(req.body) : req.body);

    const data = await maps.nearbySearch({
      location: {
        lat: inputBody.location.lat,
        lng: inputBody.location.lng,
      },
      radius: inputBody.radius,
      keyword: inputBody.keywords,
    });

    const placeProcessingPromises = data.map(async (place: any) => {
      if (!place.id) return null;

      const placeReviews = (await maps.getPlaceDetails({
        placeId: place.id,
      }));

      const reviewPromises = placeReviews?.map(async (review: any) => {
        if (!review || !review.text) return null;
        const reviewText = review?.text?.text;
        if (typeof reviewText === "string" && supabase) {
          const reviewEmbedding =
          await openai.getEmbedding(reviewText);

          const sameReview = await supabase
            .from("review_embedding")
            .select()
            .eq("content", review?.text?.text)
            .eq("place_id", place.id);

          if (sameReview?.data?.length &&
            sameReview?.data?.length > 0) {
            console.log("FOUND REVIEW EMBEDDING");
          } else {
            console.log("NO REVIEW EMBEDDING FOUND");
          }

          if (reviewEmbedding?.length === 1536 &&
            sameReview?.data?.length === 0) {
            console.log("INSERTING REVIEW EMBEDDING");
            await supabase.from("review_embedding").insert({
              content: reviewText,
              embedding: reviewEmbedding,
              url: place.googleMapsUri,
              place_id: place.id,
            });
          }

          return {
            content: reviewText,
            url: place.googleMapsUri,
            place_id: place.id,
          };
        }

        return;
      });

      const response = await Promise.all(reviewPromises ?? []) ?? [];
      const placeIds = [...new Set(response.flat().map((review: any) => review.place_id))];

      return placeIds;
    });

    const finalResponse = (await Promise.all(placeProcessingPromises)).flat();

    res.json(finalResponse);
  } catch (e: any) {
    let errorMsg = LOCAL_ERROR_MSG;
    if (e instanceof z.ZodError) {
      errorMsg += formatZodError(e);
    } else {
      console.error(e);
      errorMsg += (e.message|| "Unknown error");
    }
    const error = {error: errorMsg};
    console.error(error);
    res.status(500).json(error);
  }
};
