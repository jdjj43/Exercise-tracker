const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');

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

// ESQUEMA DE EXERCISES
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

// 4 post
app.post('/api/users', (req, res) => {
  //checkear si existe en base de datos
  const execute = async () => {
    try {
      const data = await Username.findOne({ username: req.body.username });
      if (!data) {
        Username.create({
          username: req.body.username
        });
        const newData = await Username.findOne({ username: req.body.username });
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

app.post('/api/users/:_id/exercises', (req, res) => {
  const execute = async () => {
    try {
      const userExists = await Username.findOne({ _id: req.params._id });
      if (userExists) {
        Exercise.create({
          user_id: req.params._id,
          description: req.body.description,
          duration: req.body.duration,
          date: req.body.date
        })
        res.json({
          _id: req.params._id,
          username: userExists.username,
          description: req.body.description,
          duration: req.body.duration,
          date: req.body.date
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


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
