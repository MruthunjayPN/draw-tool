import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function middleware (req : Request , res : Response, next : NextFunction) {
    //empty string to avoid ts error , coz jwt.verify accepts string as 1st input
    const token = req.headers["authorization"] ?? "";

    const decoded = jwt.verify(token , JWT_SECRET)
    if(decoded){
        //@ts-ignore -> see how to update the structure of the req object in express
        req.userId = decoded.userId 
        next();
    }else {
        res.status(403).json({
            "message" : "Unauthorized"
        })
    }
}