import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';

import { apiRouter } from './controllers';
import { getWhitelistFromEnv } from './utils';

dotenv.config();

const whitelist = [...getWhitelistFromEnv(process.env.API_WHITELIST)];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('blocking cors from origin \n', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
};

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`R33 BASE listening on port ${port}...`);
});
