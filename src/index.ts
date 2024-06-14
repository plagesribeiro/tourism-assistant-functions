import * as functions from "firebase-functions";
import * as express from "express";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as dotenv from "dotenv";
import {Response, Request} from "express";
import {
  getPredictions,
  getPlaceDetails,
  seedReviews,
} from "./endpoits/maps";
import {checkAuth} from "./services/auth";
import {embeddingSearch} from "./endpoits/recommender";

dotenv.config();
admin.initializeApp();

// If needed a public route
// const appPublic = express();
// appPublic.use((cors({origin: true})));
// appPublic.get("/", (req: Request, res: Response) => res.status(200).send("Public Route!"));
// export const publicApp = functions.https.onRequest(appPublic);


// App Privado
const apiPriv = express()
  .use(cors({origin: true}))
  .use(checkAuth)
  .get("/", (req: Request, res: Response) => res.status(200).send("Hello World! You are authenticated!"))
  .post("/maps/getPredictions", getPredictions)
  .post("/maps/getPlaceDetails", getPlaceDetails)
  .post("/maps/seedReviews", seedReviews)
  .post("/recommender/embeddingSearch", embeddingSearch);

export const privApi = functions
  .runWith({
    timeoutSeconds: 360,
    memory: "2GB",
  })
  .https.onRequest(apiPriv);
