/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dotenv from "dotenv";
dotenv.config();

const GOOGLE_MAPS_URL = "https://maps.googleapis.com/maps/api";
const GOOGLE_MAPS_PLACES_URL = "https://places.googleapis.com/v1/places";

const getHeaders = (body: {fieldMask: any, placesInit: boolean} = {fieldMask: null, placesInit: false}) => {
  if (!process.env.GOOGLE_MAPS_API_KEY || typeof process.env.GOOGLE_MAPS_API_KEY !== "string") throw new Error("Missing Google Maps API key");

  const getHeaders = body.placesInit ?
    Object.keys(body.fieldMask).map((key) => `places.${key}`).join(",") ?? "places.displayName" :
    Object.keys(body.fieldMask).map((key) => `${key}`).join(",") ?? "displayName";
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
    "X-Goog-FieldMask": getHeaders,
  };
};

const getPredictions = async (body: {input: string}) => {
  if (!process.env.GOOGLE_MAPS_API_KEY || typeof process.env.GOOGLE_MAPS_API_KEY !== "string") throw new Error("Missing Google Maps API key");

  const queryParams = new URLSearchParams({
    input: body.input,
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  try {
    const response = await fetch(`${GOOGLE_MAPS_URL}/place/autocomplete/json?${queryParams}`);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(data.status ?? "");
    }

    return data.predictions;
  } catch (e: any) {
    if (e.message) throw new Error(e.message);
    throw new Error("Unknown error");
  }
};

const getPlaceDetails = async (body: {placeId: string}) => {
  try {
    const response = await fetch(`${GOOGLE_MAPS_PLACES_URL}/${body.placeId}`, {
      headers: getHeaders({
        fieldMask: {
          reviews: true,
        },
        placesInit: false,
      }),
    });

    const data = await response.json();

    return data.reviews;
  } catch (e: any) {
    if (e.message) throw new Error(e.message);
    throw new Error("Unknown error");
  }
};

const nearbySearch = async (inputBody: {
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  keyword: string[];
}) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) throw new Error("Missing Google Maps API key");

  try {
    const response = await fetch(`${GOOGLE_MAPS_PLACES_URL}:searchNearby`, {
      method: "POST",
      body: JSON.stringify({
        includedTypes: inputBody.keyword,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: inputBody.location.lat,
              longitude: inputBody.location.lng,
            },
            radius: inputBody.radius * 1000,
          },
        },
      }),
      headers: getHeaders({
        fieldMask: {
          id: true,
          displayName: true,
          addressComponents: true,
          businessStatus: true,
          googleMapsUri: true,
          currentOpeningHours: true,
          priceLevel: true,
          photos: true,
          rating: true,
          userRatingCount: true,
          reviews: true,
        },
        placesInit: true,
      }),
    });

    const data = await response.json();

    return data.places;
  } catch (e: any) {
    console.error(e);
    if (e.message) throw new Error(e.message);
    throw new Error("Unknown error");
  }
};

export const maps = {
  getPredictions,
  getPlaceDetails,
  nearbySearch,
};
