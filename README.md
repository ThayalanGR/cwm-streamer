# CWM Streamer

CWM Streamer is used to scrap courses content from certain platform and replicates the same course like platform running standalone.

## Modules

1. Scrapper
   - Responsible for scrapping the content from the setup course platform.
   - Downloads the content from course platform
   - Creates a Release and upload all the content as assets in github.
   - Saves/Write the schema into a json file for later client consumption.
2. Client
   - Reads all the schema generated by scrapper and form a single document db like structure documents.
   - Serves the client for the course documents in a structured way.

## Technologies used

1. Node for scrapping
2. React
3. Octokit for releasing assets into github
4. Zustand
5. Firebase
6. Fluid UI as design system
