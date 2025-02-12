import express, { Request, Response } from 'express';
import { middleware } from "./middleware";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config";
import prisma from "@repo/db/client";
import bcrypt from 'bcrypt';
import { CreateUserSchema , SigninSchema , CreateRoomSchema } from "@repo/common/types "
const app = express();
app.use(express.json());


// Explicitly type the route handler
//@ts-expect-error
app.post('/signup', async (req: Request, res: Response) => {
  // Zod validation
  const data = CreateUserSchema.safeParse(req.body);
  if (!data.success) {
    res.status(403).json({ msg: 'Incorrect inputs' });
    return;
  }

  // Fetching body
  const { email, password, name } = req.body;

  // db.create
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password : hashedPassword,
      },
    });
    //notice that although we didnt give photo url while creating user, it will still be taken care by prisma client as it is optional

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    return res.json({ token });
  } 
  catch (e) {
    res.status(411);
    console.log(e); // Log the error for debugging
    return res.json({ error: 'Error while signing up' });
  }
});

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