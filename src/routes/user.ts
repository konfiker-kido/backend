import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt';
import { joiSchema } from '../commonValidation/joiSchema';



export const userRouter = new Hono<{
    Bindings:{
       DATABASE_URL:string,
       JWT_SECRET_KEY:string
    }
 }>();


userRouter.post('/signin',async (c) => {

    // we have to create the PrismaClient instance here only bcz, only c has priviladge to access the env
    const prisma=new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())
  
    const body= await c.req.json();
    try{
        const {email,password}=body;
    
        const user= await prisma.user.findFirst({
          where:{
            email: body.email,
            password:body.password,
          }
       })
       if(!user){
        console.log("User not Found"); 
          c.status(403);
          return c.text('Invalid Credential'); 
       }
        
  
        const token=await sign({
            id:user.id
        },c.env.JWT_SECRET_KEY); 
         
        return c.json({
            message:"Signed In", 
            token:token
        });
    }catch(error){

        return c.json({
             message:"Failed to Login ",
             error:error
        })
    }
     
  })
  

  // creating a new User
  userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())
  
    try {
      const body = await c.req.json();
     
      const {error}= joiSchema.userSchema.validate(body);
        // Validate required fields
        if (error) {
            return c.json(error, 400); 
        }
  
        // Create new user
        
        const newUser = await prisma.user.create({
            data: {
                email: body.email,  
                password: body.password, // In production, hash this password!
                name: body.name
            }
        });
        

        // Create JWT payload
        const payload = {
            id: newUser.id,
            email: newUser.email
        };
  
        // Sign JWT
        const token = await sign(payload, c.env.JWT_SECRET_KEY); 
  
        return c.json({
            message: "User created successfully",
            token: token
        }, 201);
  
    } catch (error) {
        console.error('Signup error:', error);
        return c.json({
            message: "Internal server error", 
            error:error
        }, 500);
    } finally {
        await prisma.$disconnect();
    }
  });
  
