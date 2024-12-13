# Use the official Node.js image with Alpine for a small footprint
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /src/index

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Install TypeScript globally to allow for compilation
RUN npm install -g typescript

# Install Prisma globally (if needed)
RUN npm install -g prisma

# Copy the rest of the application code
COPY . .


# Set environment variables if needed (e.g., for Prisma or database)
# These can also be set in a `.env` file
ENV DATABASE_URL: "prisma://accelerate.prisma-data.net/?..."
ENV JWT_SECRET_KEY: "maurya@6903"

# Run TypeScript compilation to build the app (ensure your tsconfig.json is set up correctly)
RUN tsc



# Expose the port your app will run on (adjust this based on your app's setup)
EXPOSE 3000

# Start the application (change the start command as per your setup)
CMD ["npm", "run", "start"]
