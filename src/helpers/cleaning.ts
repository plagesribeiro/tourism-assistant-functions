/* eslint-disable @typescript-eslint/no-explicit-any */
import {openai} from "../services/openai";

export const getCleanPlace = async (data: any) => {
  const cleanedReviews = await cleanReviews(data.reviews);
  const cleanedAddressComponents = cleanAddressComponents(data.address_components);

  let weightedRatingsSum = 0;
  let counter = 0;
  if (cleanedReviews) {
    for (const review of cleanedReviews) {
      if (!review || !review.positivenessRating || !review.rating || !review.usefulnessRating || !review.usefulnessRating ) continue;
      if (review.positivenessRating <= 0.5 || review.usefulnessRating <= 0.5) continue;

      counter++;
      weightedRatingsSum += (review.rating * review.positivenessRating * review.usefulnessRating);
    }
  }

  const weightedRating = weightedRatingsSum / counter;

  const cleanData = {
    placeInfo: {
      address_components: cleanedAddressComponents,
      business_status: data.business_status,
      current_opening_hours: data.current_opening_hours,
      ratings_total: data.user_ratings_total,
      reviews: cleanedReviews ?? [],
    },
    location: {
      lat: data.geometry?.location.lat,
      lng: data.geometry?.location.lng,
    },
    name: data.name,
    weighted_rating: weightedRating,
    url: data.url,
  };


  return cleanData;
};

const cleanReviews = async (reviews: any) => {
  if (!reviews) return;
  const orderedReviews = reviews.sort((a: any, b: any) => b.time - a.time).slice(0, 100);
  const filteredReviews = orderedReviews.map(async (review: any) => {
    if (!review.text) return;
    const usefulnessRating = await openai.usefulnessRating(review.text);
    if (usefulnessRating <= 0.5) return;

    const positivenessRating = await openai.positivenessRating(review.text);

    return {
      rating: review.rating,
      time: review.time,
      relative_time_description: review.relative_time_description,
      text: review.text,
      positivenessRating,
      usefulnessRating,
    } as {
        rating?: number;
        time?: number;
        relative_time_description?: string;
        text?: string;
        positivenessRating?: number;
        usefulnessRating?: number;
        embeddingsSimilarity?: number;
      };
  });


  return await Promise.all(filteredReviews);
};

const cleanAddressComponents = (data: any) => {
  if (!data) return;
  const country = data.find((c: any) =>
    c.types.includes("country")
  );
  const city = data.find((c: any) =>
    c.types.includes("administrative_area_level_2")
  );
  const address = data.find((c: any) =>
    c.types.includes("route")
  );
  const number = data.find((c: any) =>
    c.types.includes("street_number")
  );
  const state = data.find((c: any) =>
    c.types.includes("administrative_area_level_1")
  );

  return {
    country: country?.long_name,
    city: city?.long_name,
    address: address?.short_name,
    number: number?.short_name,
    state: state?.short_name,

  };
};
