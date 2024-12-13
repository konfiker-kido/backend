import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt';
import { joiSchema } from '../commonValidation/joiSchema';
 
export const blogRouter = new Hono<{
    Bindings: {
       DATABASE_URL: string,
       JWT_SECRET_KEY: string
    },
    // adding variables to context (c)
    Variables: {
        userId: string; 
    }
}>();


blogRouter.use('/*', async (c, next) => {
    const jwt = c.req.header("Authorization") || "";
      
    // Check if JWT is present
    if (!jwt) {
        c.status(401);
        return c.json({ error: "unauthorized" });
    }


    try {
        // Verify the token
        const payload = await verify(jwt, 'maurya@6903'); 
        
        // Ensure payload exists and has an id
        if (!payload || !payload.id) {
            c.status(401);
            return c.json({ error: "Invalid token" }); 
        }

        // Set the userId in the context
        c.set('userId', payload.id.toString());
        
        // Continue to the next middleware or route handler
        await next();
    } catch (error) {
        // Handle verification errors
        c.status(401);
        return c.json({ error: "Token verification failed" });
    }
})

blogRouter.post('/create', async (c) => {
    
     // Initialize Prisma with accelerate
     const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

   
    try {
        // Parse request body
        const body = await c.req.json();
        const {error}=joiSchema.createBlogSchema.validate(body);
        // Validate input
        if (error) {
            c.status(400);
            return c.json({ 
                error: error.message
            });
        }

        const time = new Date();
      
        const authorId=c.get('userId');    
        const newPost = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: authorId,  
                // timeStamp: `${time.getDate()} ${month[(time.getMonth()-1)]} , ${time.getFullYear()}`
                // timeStamp:timeStr
            },
            select: {
                id: true,
                title: true,
            }
        });

        // Return success response
        return c.json({ 
            message: "Blog post created successfully", 
            post: newPost 
        });

    } catch (error) {
        console.error('Blog creation error:', error);
        
        // Handle specific error types
        if (error instanceof Error) {
            c.status(500);
            return c.json({ 
                error: "Failed to create blog post", 
                details: error.message 
            });
        }

        // Generic error handling
        c.status(500);
        return c.json({ 
            error: "Unexpected error occurred" 
        });
    }
});


 blogRouter.get('/:id',async(c)=>{
      
    const id=c.req.param("id");
    const prisma=new PrismaClient({
          datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
        const post=await prisma.post.findFirst({
            where:{
                id:id  
            } 
        })  
        const authorData = await prisma.user.findUnique({ 
            where: {
              id: c.get('userId'),  
            },
            select:{
                email:true,
                name:true
            }
          }) 
        // console.log(" author data : == ",authorData);        
        return c.json({     
            post,authorData
        });  
    }catch(error){
        return c.json({
            message:"Error while fetching blog post"
        })  
    }

 });

 blogRouter.put('/update',async(c)=>{
      
    const body =await c.req.json();
    const prisma=new PrismaClient({
          datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{

        await prisma.post.update({
             where:{
                id:body.id
             },
              data:{
                 title:body.title,
                 content:body.content,
              }
        })
    }catch(error){
        return c.json({
            message:"Error while Updating blog post"
        })
    }

 });


 blogRouter.get('get/bulk', async (c) => {  
     // Initialize Prisma with accelerate
     const prisma = new PrismaClient({
         datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate());


    try {
      console.log("This is one of the end-points");  
        // Optional: Add pagination and filtering
        const page = Number(c.req.query('page')) || 1;
        const limit = Number(c.req.query('limit')) || 10;
        const skip = (page - 1) * limit;

    
        const blogs = await prisma.post.findMany({
            select: {  
                id: true,
                title: true,
                content: true,
                published: true,
                timeStamp: true,
                author: {
                  select: {
                    name: true, // Only select the author's name
                    role:true
                  }
                }
              },
              orderBy: {
                timeStamp: 'desc'
              }
            })

        // Get total count for pagination metadata
        const totalBlogs = await prisma.post.count();
  console.log("here are "); 
        // Return paginated response
        return c.json({
            blogs  
        });

    } catch (error) {
        console.error('Bulk blog fetch error:', error);
        
        c.status(500);
        return c.json({ 
            error: "Failed to retrieve blog posts", 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});