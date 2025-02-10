import express from "express";
import { middleware } from "./middleware";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema , SigninSchema , CreateRoomSchema } from "@repo/common/types "
const app = express();


app.post('/signup' , (req , res)=> {
    //zod validation
    const data = CreateUserSchema.safeParse(req.body);
    if(!data.success) { 
        res.status(403).json({msg : "incorrect inputs"});
        return;
    }
    //fetching body
    const username = req.body.username ;
    const password = req.body.password ;
    //middleware call
    //db.create
    //jwt token created form username. retrun it to user
    res.status(200).json({ 
         "message":"user created",
         userId : 14654  
    })
    
})

app.post('/signin' ,  (req, res)=>{

    const data = SigninSchema.safeParse(req.body);
    if(!data.success) { 
        res.status(403).json({msg : "incorrect inputs"});
        return;
    }

    const userId = 564;
    const token = jwt.sign({userId}, JWT_SECRET);
    res.json(token);
})

app.post('/room' , middleware , (req, res)=>{
    
    const data = CreateRoomSchema.safeParse(req.body);
    if(!data.success) { 
        res.status(403).json({msg : "incorrect inputs"});
        return;
    }

    //db call
    res.json({rootID : 145564});
})

app.listen(3000);