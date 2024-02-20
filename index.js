const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const moment = require('moment'); // require
moment().format();

app.use(bodyParser.urlencoded({ extended: false }));

//1  Conectar a mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

// ESQUEMA DE USERNAME
//2 Creamos los esquemas para la base de datos
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
})
// 3 creamos un objeto username
const Username = mongoose.model("Username", userSchema);

// 5 ESQUEMA DE EXERCISES
const exercisesSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
})
const Exercise = mongoose.model("Exercise", exercisesSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// 7 get de users
app.get('/api/users', (req, res) => {
  const execute = async () => {
    try {
      const data = await Username.find({});
      if (data) res.json(data);
    } catch (error) {
      console.log(error);
    }
  }
  execute();
})


// 4 post
app.post('/api/users', (req, res) => {
  //checkear si existe en base de datos
  const execute = async () => {
    try {
      const data = await Username.findOne({ username: req.body.username });
      if (!data) {
        const dataAPasar = {
          username: req.body.username
        }
        await Username.create(dataAPasar);
        const newData = await Username.findOne(dataAPasar);
        res.json({ username: newData.username, _id: newData._id });
      }
      if (data) {
        res.json({ username: data.username, _id: data._id });
      }
    } catch (error) {
      console.log(error);
    }
  }
  execute();
});

// 6 post de exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  const execute = async () => {
    try {
      const userExists = await Username.findOne({ _id: req.params._id });
      let date
      if (req.body.date) {
        date = new Date(req.body.date).toDateString();
      } else {
        date = new Date().toDateString();
      }
      if (userExists) {
        Exercise.create({
          user_id: req.params._id,
          description: req.body.description,
          duration: req.body.duration,
          date: date,
        })
        res.json({
          _id: req.params._id,
          username: userExists.username,
          date: date,
          duration: parseInt(req.body.duration),
          description: req.body.description,
        });
      } else {
        res.json({
          error: "user does not exists"
        })
      }

    } catch (error) {
      console.log(error);
    }
  };
  execute();
});

app.get('/api/users/:id/logs', async (req, res) => {
  try {
    const exercisesQuery = { user_id: req.params.id };

    // Verificar si se proporcionan parámetros de fecha en el URL
    if (req.query.from) {
      exercisesQuery.date = exercisesQuery.date || {};
      exercisesQuery.date.$gte = new Date(`${req.query.from}T00:00:00.000Z`);
    }

    if (req.query.to) {
      exercisesQuery.date = exercisesQuery.date || {};
      exercisesQuery.date.$lt = new Date(`${req.query.to}T23:59:59.999Z`);
    }

    console.log(exercisesQuery)

    const limit = req.query.limit ? parseInt(req.query.limit) : 0;

    const exercises = await Exercise.find(exercisesQuery).limit(limit);
    const user = await Username.findOne({ _id: req.params.id });

    if (user) {
      if (exercises && exercises.length > 0) {
        const log = exercises.map((exercise) => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }));

        res.json({
          _id: user._id,
          username: user.username,
          count: log.length,
          log: log,
        });
      } else {
        res.json({ error: "No exercises found" });
      }
    } else {
      res.json({ error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
