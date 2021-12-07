var express = require('express');
var router = express.Router();
var he = require('he');
var axios = require('axios').default;

// Mongoose connection and collection
const mongoose = require('mongoose');
const db = mongoose.connection;
const Schema = mongoose.Schema;
const mySchema = new Schema({_id: String, score: Number}, {collection: 'scores'});
const MyModel = mongoose.model('scores', mySchema );

/* GET home page. */
router.get('/', function(req, res, next) {
  res.cookie("score", "0", { httpOnly: false });; // reset player score to 0
  res.render('index', { title: 'TRIVIA CHALLENGER' });
});

/* POST question selection page. */
router.post('/selection', function(req, res, next) {
  res.cookie("name", req.body.name, { httpOnly: false }); // store the player's name
  res.cookie("time", "60", { httpOnly: false }); // restart the amount of time
  res.render('selection', { title: 'TRIVIA CHALLENGER', score: req.cookies["score"], time: "60" }); 
});

/**
 * Retrieves the corresponding category index for api request
 * 
 * @param {String} category category of the question selected
 * @returns {Number} index of the category to submit in api request
 */
function categoryIndex(category) {
  const categories = new Map([["general", 9], ["art", 25], ["celebrities", 26], ["film", 11], ["music", 12], ["science", 17], ["sports", 21]]);
  return categories.get(category);
}

/**
 * Submits request to retrieve the next api question based on selected category and difficulty
 * 
 * @param {Number} category index of what category was selected
 * @param {String} difficulty level of difficulty selected for the question
 * @returns {Object} parsed object of the api response (question + answer choices)
 */
async function getQuestion(category, difficulty) {
  try {
    const response = await axios.get("https://opentdb.com/api.php?amount=1&category=" + category + "&difficulty=" + difficulty);
    const result = await response.data;
    return result;
  }
  catch (error) {
    console.error(error);
  }
}

/**
 * Decodes HTML text by replacing entities with the corresponding symbols
 * 
 * @param {String} string HTML text
 * @returns {String} result with HTML entities decoded
 */
function decode(string) {
  return he.decode(string);
}

/**
 * Makes an array of the answer choices with the correct one randomly inserted
 * 
 * @param {String} correct actual answer to the question
 * @param {String[]} incorrect incorrect answer choices to the question
 * @returns {String[]} array of all possible answer choices
 */
function makeChoices(correct, incorrect) {
  res = [];
  const index =  Math.floor(Math.random() * (incorrect.length + 1)); // generate random index to insert answer
  incorrect.splice(index, 0, correct); // insert the correct answer
  // decode all answer choices
  for(let item of incorrect) {
    res.push(decode(item)); 
  }
  return res;
}

/* POST question page. */
router.post('/question', async function(req, res, next) {
  const category = req.body.category;
  const difficulty = req.body.difficulty; 
  res.cookie("difficulty", difficulty, { httpOnly: false }); // store difficulty for score calculation
  
  // get question
  const cIndex = categoryIndex(category);
  const apiRes = await getQuestion(cIndex, difficulty);
  const question = decode(apiRes["results"][0]["question"]);
  
  // get answer choices
  const answer = apiRes["results"][0]["correct_answer"]; 
  res.cookie("answer", answer, { httpOnly: false }); // store correct answer for checking accuracy
  const incorrect = apiRes["results"][0]["incorrect_answers"];
  const choices = makeChoices(answer, incorrect);

  res.render('question', { title: 'TRIVIA CHALLENGER', question: question, choices: choices, score: req.cookies["score"], time: req.cookies["time"] });
});

/**
 * Returns the number of points associated with the selected difficulty level
 * 
 * @param {String} difficulty selected difficulty level
 * @returns {Number} the number of points
 */
function getPoints(difficulty) {
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
  const difficulty = req.cookies["difficulty"];
  let score = parseInt(req.cookies["score"]);
  // updates points based on answer correctness
  if(choice === req.cookies["answer"]) {
    score += getPoints(difficulty);
  }
  else {
    score -= getPoints(difficulty);
  }
  res.cookie("score", score.toString(), { httpOnly: false });
  res.render('selection', { title: 'TRIVIA CHALLENGER', score: score, time: req.cookies["time"] });
});

/* GET final results and rankings page. */
router.get('/rankings', async function(req, res, next) {
  // upsert the score for the given name
  const query = { _id: req.cookies["name"] };
  const update = { $set: { _id: req.cookies["name"], score: req.cookies["score"] }};
  const options = { upsert: true };
  await MyModel.updateOne(query, update, options);

  // sort the documents by score
  const pipeline1 = [
    { $sort: { score: -1 } }
  ];
  const sorted = await MyModel.aggregate(pipeline1);

  // get the rank of the current player
  let rank = 0;
  for await (const doc of sorted) {
    rank++;
    if(doc._id === req.cookies["name"]) {
      break;
    }
  }

  // count the total number of people
  const total = await MyModel.countDocuments();

  // get the top three players 
  const pipeline2 = [
    { $sort: { score: -1 }},
    { $limit: 3 }
  ]
  const reigning = await MyModel.aggregate(pipeline2);

  res.render('rankings', { title: 'TRIVIA CHALLENGER', name: req.cookies["name"], score: req.cookies["score"], rank: rank, total: total, reigning: reigning });
});

if (typeof module != 'undefined') {
  module.exports = {
      router: router,
      categoryIndex: categoryIndex,
      getQuestion: getQuestion,
      decode: decode,
      makeChoices: makeChoices,
      getPoints: getPoints
  };
}