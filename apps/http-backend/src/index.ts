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

//@ts-expect-error
app.post('/signin' , async (req, res)=> {
  const data = SigninSchema.safeParse(req.body);
  if(!data.success) { 
      res.status(403).json({msg : "incorrect inputs"});
      return;
  }

  try {
    // Find the user by email
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Compare the input password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    // Generate a JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    return res.json({ token });
  }
  catch(e){
    res.json({msg : "error while signing in"});
  }
});

app.post('/room' , middleware , async (req, res)=>{
    
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if(!parsedData.success) { 
      res.status(403).json({msg : "incorrect inputs"});
      return;
  }
    
  try {
    //@ts-ignore
    const userId = req.userId
    
    //db call
    const room = await prisma.room.create({
      data : {
        slug : parsedData.data.name , 
        adminId : userId
      }
    })
    res.json({
      roomId : room.roomId
    })
  }
  catch(e){
    console.log(e);
    res.json({
      msg : "error while creating room -  room already exists with this name" })
  }
});

app.listen(3000);