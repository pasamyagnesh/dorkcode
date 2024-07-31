# Dork Application

[Dork](D:/dork.png)
Welcome to our **Dork Application**! This project uses the [Codeforces API](https://codeforces.com/apiHelp) to allow users to solve problems in over 30 different data structures and algorithms concepts, including constructive algorithms, bit manipulation, sorting, strings, and more.

## Technologies Used

- **Frontend**: JavaScript, CSS, EJS
- **Backend**: Node.js, Express
- **API Fetching**: Axios
- **Database**: PostgreSQL
- **Cloud Storage**: Supabase
- **Hosting**: Vercel
# Node.js Project Documentation

This document provides an overview of the Node.js packages used in the project and their purposes.

## Packages Used

### `nodemailer`
- **Description**: A module for sending emails from Node.js applications.
- **Usage**: Used to handle email communication, such as sending registration or notification emails.

### `express`
- **Description**: A minimal and flexible Node.js web application framework providing a robust set of features.
- **Usage**: Used to build the web server, handle HTTP requests, and define routes for the application.

### `express-session`
- **Description**: Middleware for handling sessions in Express.js applications.
- **Usage**: Manages user sessions, storing session data across multiple requests to maintain user state.

### `body-parser`
- **Description**: Middleware to parse incoming request bodies in various formats (JSON, URL-encoded, etc.).
- **Usage**: Parses request bodies to make them accessible in `req.body`, simplifying data handling in routes.

### `bcrypt`
- **Description**: A library for hashing and verifying passwords.
- **Usage**: Provides secure password hashing and comparison, enhancing authentication security.

### `multer`
- **Description**: Middleware for handling `multipart/form-data`, primarily used for file uploads.
- **Usage**: Handles file uploads from forms, storing uploaded files and making them accessible in the application.

### `pg`
- **Description**: PostgreSQL client for Node.js.
- **Usage**: Connects to and interacts with a PostgreSQL database for data storage and retrieval.

### `axios`
- **Description**: A promise-based HTTP client for making requests to external APIs.
- **Usage**: Facilitates communication with external services or APIs by making HTTP requests and handling responses.

### `moment-timezone`
- **Description**: A timezone-aware extension for the `moment` library.
- **Usage**: Parses, manipulates, and displays dates and times across various time zones.

### `request-ip`
- **Description**: Middleware for obtaining the client IP address from the request.
- **Usage**: Retrieves and processes the IP address of the client making the request, useful for logging or geo-location.

### `dotenv`
- **Description**: A module for loading environment variables from a `.env` file into `process.env`.
- **Usage**: Manages environment-specific variables like database URLs and secret keys, enhancing configuration flexibility.

### `http`
- **Description**: Node.js core module for creating HTTP servers and clients.
- **Usage**: Part of the Node.js core modules, used to create and manage HTTP servers and clients without needing additional installation.

## Setup and Installation

1. **Create a `.env` file**: Place this file in the root directory of your project to store environment variables.

2. **Install Dependencies**: Run the following command to install all required packages:

    ```bash
    npm install nodemailer express express-session body-parser bcrypt multer pg axios moment-timezone request-ip dotenv
    ```

3. **Configure the Environment**: Ensure your `.env` file includes necessary variables such as `DATABASE_URL` for PostgreSQL connection and any other configuration needed for your application.
## Live Demo

You can view the live application here: [Dork Application](https://dork-application.vercel.app/)

## Hosting on Local Machines

The application will run on port 3000. To access it locally on your network, find your IP address using the `ipconfig` command and visit `http://<YOUR_IP>:3000/` in your browser.


## Contributing

1. Clone the repository: `git clone https://github.com/pasamyagnesh/dorkcode.git`
2. Navigate to the project directory: `cd dorkcode`
3. Run the server: `node server.js`

---

Happy Coding!
