var express = require('express');
var router = express.Router();
var he = require('he');
var cookieParser = require('cookie-parser');

// Mongoose connection and collection
const mongoose = require('mongoose');
const db = mongoose.connection;
const Schema = mongoose.Schema;
const mySchema = new Schema({_id: String, score: Number}, {collection: 'scores'});
const MyModel = mongoose.model('scores', mySchema );

let name;
let score;
let answer;
let difficulty;

/* GET home page. */
router.get('/', function(req, res, next) {
  score = 0;
  res.render('index', { title: 'TRIVIA CHALLENGER' });
});

/* POST question selection page. */
router.post('/selection', function(req, res, next) {
  name = req.body.name;
  res.cookie("time", "60", { httpOnly: false });
  res.render('selection', { score: score, time: "60" });
});

function categoryIndex(category) {
  const categories = new Map([["general", 9], ["art", 25], ["celebrities", 26], ["film", 11], ["music", 12], ["science", 17], ["sports", 21]]);
  return categories.get(category);
}

async function getQuestion(category, difficulty) {
  const fetch = (url) => import('node-fetch').then(({default: fetch}) => fetch(url));
  const response = await fetch("https://opentdb.com/api.php?amount=1&category=" + category + "&difficulty=" + difficulty);
  if(!response.ok) {
    throw new Error("Error status: " + response.status);
  }
  const result = await response.text();
  return JSON.parse(result); 
}

function decode(string) {
  return he.decode(string);
}

function makeChoices(correct, incorrect) {
  res = [];
  const index =  Math.floor(Math.random() * (incorrect.length + 1));
  incorrect.splice(index, 0, correct);
  for(let item of incorrect) {
    res.push(decode(item));
  }
  return res;
}

/* POST question selection page. */
router.post('/question', async function(req, res, next) {
  const category = req.body.category;
  difficulty = req.body.difficulty;
  
  const cIndex = categoryIndex(category);
  const apiRes = await getQuestion(cIndex, difficulty);
  const question = decode(apiRes["results"][0]["question"]);
  answer = apiRes["results"][0]["correct_answer"];
  const incorrect = apiRes["results"][0]["incorrect_answers"];
  const choices = makeChoices(answer, incorrect);

  res.render('question', { question: question, choices: choices, score: score, time: req.cookies["time"] });
});

function getPoints() {
  if(difficulty === "easy") {
    return 10;
  }
  else if(difficulty === "medium") {
    return 30;
  }
  else {
    return 50;
  }
}

/* POST question selection page. */
router.post('/check', function(req, res, next) {
  const choice = req.body.choice;
  if(choice === answer) {
    score += getPoints();
  }
  else {
    score -= getPoints();
  }
  res.render('selection', { score: score, time: req.cookies["time"] });
});

router.get('/rankings', async function(req, res, next) {
  const query = { _id: name };
  const update = { $set: { _id: name, score: score }};
  const options = { upsert: true };
  await MyModel.updateOne(query, update, options);

  const pipeline1 = [
    { $sort: { score: -1 } }
  ];
  const sorted = await MyModel.aggregate(pipeline1);

  let rank = 0;
  for await (const doc of sorted) {
    rank++;
    if(doc._id === name) {
      break;
    }
  }
  const total = await MyModel.countDocuments();

  const pipeline2 = [
    { $sort: { score: -1 }},
    { $limit: 3 }
  ]
  const reigning = await MyModel.aggregate(pipeline2);

  res.render('rankings', { name: name, score: score, rank: rank, total: total, reigning: reigning });
});

module.exports = router;
