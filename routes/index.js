var express = require('express');
var router = express.Router();
var he = require('he');

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
  res.render('selection', { score: score });
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
  console.log(apiRes);
  const question = decode(apiRes["results"][0]["question"]);
  answer = apiRes["results"][0]["correct_answer"];
  const incorrect = apiRes["results"][0]["incorrect_answers"];
  const choices = makeChoices(answer, incorrect);

  res.render('question', { question: question, choices: choices, score: score });
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
  res.render('check', {score: score});
});

module.exports = router;
