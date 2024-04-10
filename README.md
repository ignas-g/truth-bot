Truth-Bot
=========

Overview
--------

Truth-Bot is an innovative application created, designed to verify information accuracy by utilizing the Wikipedia database. It's a powerful tool for checking the truthfulness of various statements, facts, and data, by sourcing directly from Wikipedia. Developed with TypeScript, Truth-Bot is a robust and reliable solution for fact verification.

Project Structure
-----------------

The project's `src` directory contains several TypeScript files each serving a unique role:

-   `MyClass.ts` & `MyClass.test.ts`: Implements and tests core functionalities of Truth-Bot.
-   `cli.ts` & `cli.test.ts`: Command-Line Interface for interacting with Truth-Bot. These files include code and tests for CLI commands.
-   `downloader.ts`: Handles downloading data from external sources, primarily Wikipedia.
-   `fetch-categories.ts`: Responsible for fetching and filtering Wikipedia categories relevant to the information being verified.
-   `index.ts`: The entry point of the application, orchestrating various modules.
-   `load.ts`: Deals with loading and initializing necessary components or data for Truth-Bot.
-   `parse.ts`: Parses downloaded data for further processing.
-   `preprocess.ts`: Pre-processes data to make it suitable for analysis.
-   `process-categories.ts`: Further processes the fetched categories to ensure relevance and accuracy.
-   `query-chroma.ts`: A specialized script for handling complex queries.
-   `query.ts`: Manages the execution of queries against the Wikipedia database.
-   `start.ts`: Used to start the application, ensuring all components are correctly initialized.
-   `wikipedia-loader.ts`: Specifically focused on loading data from Wikipedia.

Usage
-----

To use Truth-Bot, follow these steps:

1.  Clone the repository to your local machine.
2.  Install the necessary dependencies via npm or yarn.
3.  Use the CLI to input statements or facts you want to verify.

Contributing
------------

Contributions to Truth-Bot are welcome. Whether it's bug fixes, feature enhancements, or documentation improvements, feel free to fork the repository and submit a pull request.

Please follow the standard code review practices and ensure all tests pass before proposing changes.
