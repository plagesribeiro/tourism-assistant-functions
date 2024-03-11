import * as functions from "firebase-functions";
import * as express from "express";
import * as admin from "firebase-admin";
import * as cors from "cors";
import {Request, Response, NextFunction} from "express";
import * as dotenv from "dotenv";
dotenv.config();

interface RequestWithUser extends Request {
   user?: admin.auth.DecodedIdToken;
}
import {getPredictions, getPlace, getPlaceDetails, getRecommendations} from "./endpoits/maps";

admin.initializeApp();

// const appPublic = express();
// appPublic.use((cors({origin: true})));
// appPublic.get("/", (req: Request, res: Response) => res.status(200).send("Public Route!"));
// export const publicApp = functions.https.onRequest(appPublic);

const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    res.status(403).send("Unauthorized");
    return;
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];
  try {
    if (idToken === process.env.API_KEY) {
      next();
    } else {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      (req as RequestWithUser).user = decodedToken;
      next();
    }
  } catch (error) {
    res.status(403).send("Unauthorized");
  }
};

// App Privado
const apiPriv = express()
  .use((cors({origin: true})))
  .use(checkAuth)
  .post("/maps/predictions", getPredictions)
  .post("/maps/getPlace", getPlace)
  .post("/maps/getPlaceDetails", getPlaceDetails)
  .post("/maps/getRecommendations", getRecommendations);

export const privApi = functions.runWith({
  timeoutSeconds: 360,
  memory: "2GB",
}).https.onRequest(apiPriv);
