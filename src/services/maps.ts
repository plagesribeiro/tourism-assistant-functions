import {PlaceDetails} from "../helpers/mapsTypes";
import * as dotenv from "dotenv";
dotenv.config();

const googleMapsEndpoint = "https://maps.googleapis.com/maps/api";

const getPredictions = async (body: {input: string}) => {
  try {
    const queryParams = new URLSearchParams({
      input: body.input,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    });

    const response = await fetch(`${googleMapsEndpoint}/place/autocomplete/json?${queryParams}`);
    const data = await response.json();

    return data;
  } catch (error) {
    throw new Error("Internal Server Error");
  }
};
const getPlace = async (body: {placeId: string}) => {
  try {
    const queryParams = new URLSearchParams({
      place_id: body.placeId,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    });

    const response = await fetch(`${googleMapsEndpoint}/geocode/json?${queryParams}`);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error(data);
      throw new Error("Internal Server Error");
    }

    return data.results as google.maps.places.PlaceResult;
  } catch (error) {
    throw new Error("Internal Server Error");
  }
};

const getPlaceDetails = async (body: {placeId: string}) => {
  try {
    const queryParams = new URLSearchParams({
      place_id: body.placeId,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    });

    const response = await fetch(`${googleMapsEndpoint}/place/details/json?${queryParams}`);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error(data);
      throw new Error("Internal Server Error");
    }

    return data.result as PlaceDetails;
  } catch (error) {
    throw new Error("Internal Server Error");
  }
};

const nearbySearch = async (
  body: {location: string, radius: string, keyword: string},
) => {
  try {
    const queryParams = new URLSearchParams({
      location: body.location,
      radius: body.radius,
      keyword: body.keyword,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    });

    const response = await fetch(`${googleMapsEndpoint}/place/nearbysearch/json?${queryParams}`);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error(data);
      throw new Error("Internal Server Error");
    }

    return data.results as google.maps.places.PlaceResult[];
  } catch (error) {
    throw new Error("Internal Server Error");
  }
};

export const maps = {
  getPredictions,
  getPlace,
  getPlaceDetails,
  nearbySearch,
};
