import {z} from "zod";

export const seedReviewsInputBodySchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  keywords: z.string().array().nonempty(),
  radius: z.number().optional().default(10000),
});
