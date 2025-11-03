## Description

A RESTful API built with Express.js and Mastra AI that monitors and reports on global natural disasters — focusing primarily on earthquakes.

The system integrates with the USGS Earthquake API to fetch live earthquake data and uses Google’s Gemini 2.0 Flash model to generate natural-language summaries and insights.
It also exposes an Agent-to-Agent (A2A) compatible endpoint, allowing standardized communication with other AI agents.

For each A2A request, the agent:

* Fetches live earthquake data from the USGS Earthquake API

* Analyzes and summarizes the data (location, magnitude, and time of recent events)

* Highlights the 5 strongest earthquakes in the chosen time window

* Supports configurable feeds (hour, day, or week)

* Stores memory in a local LibSQL database (SQLite-style)

* Responds with structured A2A-compliant JSON-RPC 2.0 messages
## Project setup

```bash
git clone https://github.com/Oliver2929/Natural-Events-App.git
cd earthquake-agent-telex
$ npm install
```
### Environment Variables
* PORT=3000
* GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here

### Running the App Locally
* npm run build
* npm start
