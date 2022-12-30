const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yts1hwu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Middleware for verifying user
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .send({ acknowledged: false, message: 'unauthorized access' });
  }
  const accessToken = authHeader.split(' ')[1];
  jwt.verify(
    accessToken,
    process.env.USER_ACCESS_TOKEN,
    function (error, decoded) {
      if (error) {
        return res
          .status(403)
          .send({ acknowledged: false, message: 'forbidden access' });
      }
      req.decoded = decoded;
      next();
    }
  );
}

async function run() {
  try {
    // Data collection
    const taskCollection = client.db('mineTaskManager').collection('taskData');
    const taskCommentCollection = client
      .db('mineTaskManager')
      .collection('taskCommentData');

    // Json Web Token
    app.get('/jwt', async (req, res) => {
      const userEmail = req.query.email;
      const filter = { email: userEmail };
      const storedEmail = await usersCollection.findOne(filter);

      if (storedEmail) {
        const token = jwt.sign({ userEmail }, process.env.USER_ACCESS_TOKEN, {
          expiresIn: '1d',
        });
        res.send({ accessToken: token });
      } else {
        res.status(403).send({ accessToken: 'unauthorized' });
      }
    });
    app.post('/add_task', async (req, res) => {
      const taskInfo = req.body;
      const result = await taskCollection.insertOne(taskInfo);
      res.send(result);
    });
    app.get('/my_task', async (req, res) => {
      const userEmail = req.query.email;
      const query = { email: userEmail };
      const result = await taskCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });
    app.patch('/task_modify', async (req, res) => {
      const id = req.body.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isCompleted: true,
        },
      };
      const result = await taskCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    app.patch('/finished_task_modify', async (req, res) => {
      const id = req.body.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isCompleted: false,
        },
      };
      const result = await taskCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    app.delete('/task_delete', async (req, res) => {
      const id = req.body.id;
      const query = { _id: ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });
    app.get('/finished_task', async (req, res) => {
      const userEmail = req.query.email;
      const query = { email: userEmail, isCompleted: true };
      const result = await taskCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });
    // app.post('/add_comment', async (req, res) => {
    //   const comment = req.body;
    //   // console.log(comment);
    // });
  } finally {
  }
}
run().catch(error => console.log(error));

//Initial Setup
app.get('/', (req, res) => {
  res.send('Mine Task Manager server is running');
});
app.listen(port, () => {
  console.log(`Mine Task Manager server is running on port ${port}`);
});
