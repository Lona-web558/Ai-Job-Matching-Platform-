# Fitwork – AI job matching
```
npm install
npm start      # http://localhost:3000
```
Matching score = skills 60% + title 20% + location 10% + experience 10%.
Skills are auto-extracted from the free-text bio. Jobs are stored in memory; replace the `jobs` array in server.js with a database for production.
