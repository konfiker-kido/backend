import Joi from "joi";

const userSchema= Joi.object({
    email:Joi.string().
        email({
            tlds: { 
                allow: ['com', 'net', 'org', 'in', 'edu', 'gov'] // Allowed top-level domains
            }
        })
        .trim()
        .lowercase()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email cannot be empty',
            'any.required': 'Email is required'
        }) ,
    password:Joi.string()
        .trim()
        .min(6)
        .max(15)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password cannot exceed 30 characters',
            'string.empty': 'Password cannot be empty',
            'any.required': 'Password is required'
        }),
    name: Joi.string().optional() 
});

 const createBlogSchema= Joi.object({
      title:Joi.string().required(),
      content:Joi.string().required(),

})




export const joiSchema={
    userSchema,
    createBlogSchema
}