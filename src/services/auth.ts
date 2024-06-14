import {Request, Response, NextFunction} from "express";
import * as admin from "firebase-admin";

interface RequestWithUser extends Request { user?: admin.auth.DecodedIdToken;}

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")
  ) {
    res.status(401).send("Unauthorized - No token provided");
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
    res.status(403).send("Forbidden - Invalid token");
  }
};
