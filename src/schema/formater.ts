/* eslint-disable @typescript-eslint/no-explicit-any */
import {z} from "zod";

export const formatZodError = (error: z.ZodError): string => {
  return error.errors.map((e) => `Error in ${e.path.join(".")}: ${e.message}`).join("; ");
};
