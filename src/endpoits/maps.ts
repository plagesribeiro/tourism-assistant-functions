import {Response, Request} from "express";
import {maps} from "../services/maps";
import {getCleanPlace} from "../helpers/cleaning";
import {openai} from "../services/openai";

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const inputBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!inputBody.input) {
      res.status(400).json({error: "Input is required"});
      return;
    }

    const data = await maps.getPredictions({input: inputBody.input});
    res.json(data);
  } catch (error) {
    res.status(500).json({error: "Internal Server Error"});
  }
};
export const getPlace = async (req: Request, res: Response) => {
  try {
    const inputBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!inputBody.placeId) {
      res.status(400).json({error: "PlaceId is required"});
      return;
    }

    const data = await maps.getPlace({placeId: inputBody.placeId});
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Internal Server Error"});
  }
};

export const getPlaceDetails = async (req: Request, res: Response) => {
  try {
    const inputBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!inputBody.placeId) {
      res.status(400).json({error: "PlaceId is required"});
      return;
    }

    const data = await maps.getPlaceDetails({placeId: inputBody.placeId});
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Internal Server Error"});
  }
};

export const getRecommendations = async (
  req: Request, res: Response
) => {
  try {
    const inputBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!inputBody.location || !inputBody.radius || !inputBody.keyword || !inputBody.user_description) {
      res.status(400).json({error: "Location, radius and keyword are required"});
      return;
    }


    const data = await maps.nearbySearch({
      location: inputBody.location,
      radius: inputBody.radius,
      keyword: inputBody.keyword,
    });

    const cleanedPlaces = [];
    console.log(data.length, " LUGARES ACHADOS!");
    let i = 0;
    for (const place of data) {
      console.log("Place " + i++);

      if (!place.place_id) continue;

      const placeDetails = await maps.getPlaceDetails({
        placeId: place.place_id,
      });

      const cleanedPlace = await getCleanPlace(placeDetails);
      if (!cleanedPlace) continue;

      const userDescriptionEmbedding = await openai.getEmbedding(inputBody.user_description);

      for (const review of cleanedPlace.placeInfo.reviews) {
        if (!review || !review.text) continue;

        const reviewEmbedding = await openai.getEmbedding(review.text);
        review.embeddingsSimilarity = openai.getEmbeddingsSimilarity(reviewEmbedding, userDescriptionEmbedding);
      }
      cleanedPlace.placeInfo.reviews.sort((a, b) => (b?.embeddingsSimilarity ?? 0) - (a?.embeddingsSimilarity ?? 0));

      // get the average of the top 4 embeddingsSimilarity
      const top4EmbeddingsSimilarity = cleanedPlace.placeInfo.reviews.slice(0, 4).reduce((acc, review) => acc + (review?.embeddingsSimilarity ?? 0), 0) / 4;
      cleanedPlaces.push({...cleanedPlace, top4EmbeddingsSimilarity});
    }

    cleanedPlaces.sort((a, b) => {
      const aScore = a.top4EmbeddingsSimilarity * (a.weighted_rating || 0);
      const bScore = b.top4EmbeddingsSimilarity * (b.weighted_rating || 0);
      return bScore - aScore;
    });

    res.json(cleanedPlaces);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Internal Server Error"});
  }
};
