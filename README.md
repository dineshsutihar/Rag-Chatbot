# RAG Based Chatbot
Building a production ready simple chatbot API that uses the RAG (Retriever, Answerer, Generator) architecture to answer questions based on a given context.

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Folder Structure](#folder-structure)
4. [Configuration](#configuration)
5. [Development](#development)
6. [Contributing](#contributing)
7. [License](#license)

## Installation

### Prerequisites

- Node.js (>= 16.x)
- npm or yarn

### Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

3. Create a `.env` file in the root directory with the following environment variables:

    ```dotenv
    MISTRAL_API_KEY=your-mistral-api-key
    UPSTASH_REDIS_REST_URL=your-upstash-redis-url
    UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
    ```

## Usage

1. Start the server:

    ```bash
    npm start
    # or
    yarn start
    ```

2. The server will be running on [http://localhost:3000](http://localhost:3000).

3. Make POST requests to the root endpoint with a JSON payload:

    ```json
    {
      "context": "text to search for",
      "question": "What do you want to know?"
    }
    ```

4. The response will be a JSON object with the answer to the question.

## Folder Structure

Here’s a brief overview of the folder structure:

- **`src/`**: Contains all source code.
  - **`controllers/`**: Contains controller files that handle incoming requests and responses.
  - **`services/`**: Contains business logic, including interactions with Redis and document processing.
  - **`models/`**: Contains files related to initializing and managing language models.
  - **`utils/`**: Contains utility functions and helper methods.
  - **`routes/`**: Contains route definitions for the API.
  - **`config/`**: Contains configuration files and environment variable management.
  - **`middlewares/`**: Contains custom middleware for handling errors and other concerns.
  - **`server.js`**: Entry point of the application.

## Configuration

- **Environment Variables**: Make sure to set up the `.env` file as described in the [Installation](#installation) section.
- **Redis**: Configure Upstash Redis using the URL and token provided.

## Development

### Running Locally

To run the development server:

```bash
npm run dev
# or
yarn dev
```

### Code Style

Follow the existing code style and practices. Use ESLint to lint your code.

### Adding New Features

1. Create a new branch for your feature:

    ```bash
    git checkout -b feature/your-feature
    ```

2. Make your changes.
3. Test your changes.
4. Submit a pull request.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes and test thoroughly.
4. Submit a pull request with a description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
