import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

import { apiRouter } from './controllers';

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
