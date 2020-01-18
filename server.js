
// constants that are used throughout project
const express = require("express");       // ... express route to handle server creation
const util = require("util");             // ... used to print objects in a colour manner for debugging
const path = require('path');             // ... used to access file location from local computer
const fs = require("fs");                 // ... used to write and read content to and in a file
const unique = require("uuid");           // ... generates a unique ID

const config = require("./config.json");  // ... access helper json file for data such as the names of the files where the data is being held and such


let app = express();

// number of files "questions" on the server
const numberOfFiles = 500;

// server for the public resources
app.use(express.static("public"));

app.use(function(req , res , next){
  console.log("request recieved");
	console.log("Method call: " + req.method);
	console.log("URL: " + req.url);
  console.log("PATH: " + req.path);
	next();
})

// creates a new session on the server for user
app.post("/sessions" , postSessions);

// creates a new unique ID and sends it to the session file
function postSessions (req , res , next){

  // generates the unique sessionID
  let sessionID = unique();

  // creates the object that will represent the user in sessions file
  let id = {};
  id["id"] = sessionID;
  id["questions"] = [];

  // writes the file to the server's directory
  fs.writeFileSync(path.join(".", config.sessionDir, sessionID + config.sessionFileType), JSON.stringify(id));

  // send the response saying it was done and all
  res.status(201).send("Your session ID is => " + sessionID);

  next();
}


// returns an array of the active sessions that are located in the directory
app.get("/sessions" , getSessions);

// takes the valid sessions on the server and displays them to the user
function getSessions (req , res , next){

  // gets the files in the directory in an array called items
  fs.readdir(path.join(".", config.sessionDir), function(err, items) {
    let body = "Sessions that are available for use <br><br><br>";
    // goes through each element of the
    for (item of items){
      // gets the file in the directory
      let rFile = fs.readFileSync(path.join(".", config.sessionDir, item));
      let file = JSON.parse(rFile);
      // console.log("file => " + util.inspect(file, false , null, true)); // used for debugginf as the object loks prettier

      // takes the available sessions and ads them to the body html for display
      body += `${file.id}<br><br>`
    }

    // console.log("array of session =>  " +  util.inspect(sessions, false , null, true));

    // sends back the array of "valid" sessions to the user
    res.status(200).send(body);
    next();

  });

}
// end of getSessions


// find the session and get rid of it
app.delete("/sessions/:sessionid" , deleteSession);

// takes a session and deletes it from the server file
function deleteSession(req , res , next){

  // the sessionid will be a params argument
  let sessionID = req.params.sessionid;
  console.log("req.params.sessionid => " + req.params.sessionid);

  // this will hold the response
  let body = "";

  // gets a file named sessionID
  let sessionFile = path.join(".", config.sessionDir, sessionID + config.sessionFileType);

  // if our session exists delete it
  // else it does not exist so we send 404
  if (fs.existsSync(sessionFile)){
    console.log("Deleted sessionFile => " + sessionFile);

    // gets rid of the file from the directory
    fs.unlinkSync(path.join(".", config.sessionDir, sessionID + config.sessionFileType), function(error) {
      if (error) {
          throw error;
      }
      // console.log("sessionFile is gone from " + config.sessionDir);
    });

    // a nice user friendly update indicating the file was removed
    body = `${sessionFile} <br> Session has been removed sucessfully thank you!<br><br>`
    res.status(200).send(body);

  } else {

    // a nice user friendly update indicating the file was not removed due to some reason
    body = `${sessionFile} <br> Unfortunately this session you requested to be deleted does not exist!<br>`
    res.status(404).send(body);

  }

  next();

}
// end of deleteSession


// helper dictionary of the various  categories and difficulties.
let categoryDifficultyConverter = {

  "category":{
    0:"any",
    1:"Science: Mathematics",
    2:"Sports",
    3:"Entertainment: Film",
    4:"Science & Nature",
    5:"Entertainment: Cartoon & Animations",
    6:"General Knowledge",
    7:"History",
    8:"Entertainment: Music",
    9:"Entertainment: Books",
    10:"Geography",
    11:"Entertainment: Video Games",
    12:"Entertainment: Television",
    13:"Celebrities",
    14:"Entertainment: Board Games",
    15:"Vehicles",
    16:"Entertainment: Japanese Anime & Manga",
    17:"Science: Computers",
    18:"Entertainment: Comics",
    19:"Entertainment: Musicals & Theatres",
    20:"Politics",
    21:"Mythology",
    22:"Science: Gadgets",
    23:"Animals",
    24:"Art"
  },

  "difficulty":{
    0:"any",
    1:"easy",
    2:"medium",
    3:"hard"
  }

}

app.get("/questions" , queryParser); // slash anything do this first the parser
// takes the query and parses it for the server to
function queryParser(req , res , next){

  if (!req.query.limit && !req.query.category && !req.query.difficulty && !req.query.token){
    randomQuestions(req , res , next);
    return;
  }

	// if the limit parameter does not exist or is less than 10 -> use a default of 10
	if(!req.query.limit || req.query.limit < 0){
		req.query.limit = 10;
	}

	// if the limit is larger than we allow, use the max
	if(req.query.limit > numberOfFiles){
		req.query.limit = numberOfFiles;
	}

  // if there is no category parameter, set to any
  if(!req.query.category || req.query.category < 0){
		req.query.category = 0; // this means anything
	}

  var categoryKeysLength = Object.keys(categoryDifficultyConverter["category"]);
  // if the category parameter is beyond what we have just make it some random parameter
  if(req.query.category >= categoryKeysLength.length){
		req.query.category = Math.floor(Math.random()*categoryKeysLength.length)+1;
	}

  // if there is no category parameter, set to any i.e. -> 0
  if(!req.query.difficulty || req.query.difficulty < 0){
		req.query.difficulty = 0; // this means anything
	}

  // all values greater than 3 are randomly selelected from [1 , 3]
  var difficultyKeysLength = Object.keys(categoryDifficultyConverter["difficulty"]);
  if (req.query.difficulty >= difficultyKeysLength.length){
    req.query.difficulty = Math.floor(Math.random()*difficultyKeysLength.length)+1;
  }

  // prints the req.query in nicely a nicely formatted manner
  // console.log("req.query =>  " +  util.inspect(req.query, false , null, true));

	next();
}

function randomQuestions(req , res , next){

  let responseObject = {};
  let questionsArray = [];

  // Read all files in the questions directory
  fs.readdir(path.join(".", config.questionDir), function(err, items) {
    let i = 0;

    for (i = 0; i < 10; i ++){
      let random = Math.floor(Math.random()*numberOfFiles)+1;
      // gets the file based on the random number
      let fileName = path.join(".", config.questionDir, random + ".txt");

      // reads the file
      let rFile = fs.readFileSync(fileName);
      // converst the string object to an actaul object
      let file = JSON.parse(rFile);

      questionsArray.push(file);

    }

    responseObject["status"] = 0;
    responseObject["results"] = questionsArray;

    res.status(200).send(responseObject);
  });
}


app.get("/questions" , getQuestions);
function getQuestions(req , res , next){

  // if our token from the query is non existent then we return there is a error
  if (!req.query.token){
    res.set("Content-Type", "text/plain");
    res.status(404).send("Please specifiy a Session in the query to get filtered results!");
    return; // this tkaes me out of this thing here
    next();
  }

  let token = req.query.token;

  // holds the arrays of objects which is the response to the user
  let questionsArray = [];
  // holds the ids for the new questions and these will be added to session.json file
  let questionsIDArray = [];
  // holds the ids from th session .json file
  let sessionIDQuestionIDArray = [];
  // what will send back to the user
  let responseObject = {};

  // how many questions the user wants our aim to try and meet this quota
  var userQuota;
  // that ids from the questions have we gotten already so we don't add again
  let choosenIDs = [];


  // even in the event the limit is a string we set to default
  if (req.query.limit == null || req.query.limit == 0 || isNaN(req.query.limit)){
    userQuota = 10; // 10 is the default number of questions to return
  } else {
    userQuota = req.query.limit; /*some query parameter*/
  }

  // if any of the of the query parameters are a string then exit
  if (isNaN(req.query.category) || isNaN(req.query.difficulty)){

    let notNumber = "<html><head><title>No Strings</title></head><body><br><br>You Entered a <b>String</b> for the query argument for either the <b>categroy</b> OR <b>difficulty</b>. <br><br><b>Unfortunately we don't accept strings please resubmit using one of the options specified below</b><br><br>";

    notNumber += "<br><br><h1>Categories are</h1><br>";

    let categories = Object.keys(categoryDifficultyConverter["category"]);
    for (cat of categories){
      notNumber += `${cat} : ${categoryDifficultyConverter["category"][cat]} <br>`;
    }

    notNumber += "<br><br><h1>Difficulty Levels are</h1>";

    let difficulties = Object.keys(categoryDifficultyConverter["difficulty"]);
    for (dif of difficulties){
      notNumber += `${dif} : ${categoryDifficultyConverter["difficulty"][dif]} <br>`;
    }

    notNumber += "</body></html>";

    res.set("Content-Type", "text/html");
    res.status(400).send(notNumber);
    return; // this takes me out of this thing here
    next();
  }

  // gets the JSON object file for the session ID
  let jsonFileName = path.join(".", config.sessionDir, token + config.sessionFileType);

  // checks if the session exist
  if (fs.existsSync(jsonFileName)){
    // the session ID is valid
    let rJsonFile = fs.readFileSync(jsonFileName);
    let jsonSessionObj = JSON.parse(rJsonFile);
    // give us the question ids currently on the session
    sessionIDQuestionIDArray = jsonSessionObj.questions;
    console.log(sessionIDQuestionIDArray);

  } else {

    responseObject["status"] = 2;
    responseObject["results"] = questionsArray;
    let stringStatusTwo = JSON.stringify(responseObject);
    let body = "<html><head><title>Invalid Sessions ID</title></head><body>You entered an invalid session ID please see GET sessions/ for one that is available. Response is as follows below<br><br>";
    body += `${stringStatusTwo}<br><br>`;
    body += "</body></html>";
    // res.setHeader();
    res.status(404).send(body);
    next();
  }

  // Read all files in the questions directory
  fs.readdir(path.join(".", config.questionDir), function(err, items) {

    // keep track of the number of questions that have met our requirements
    var count = 0;

    for (let fileNum = 0; fileNum < items.length; fileNum++) {

      // gets the file based on the random number
      let fileName = path.join(".", config.questionDir, items[fileNum]);

      // checks if the file exists at all
      if (fs.existsSync(fileName)){

        // reads the file
        let rFile = fs.readFileSync(fileName);
        // converst the string object to an actaul object
        let file = JSON.parse(rFile);

        // check to see if the question of the file we got
        // is in the sessions ID questions array
        if (sessionIDQuestionIDArray.includes(file.question_id)){
          // console.log("there is a duplicate question in the sessions file");
          continue; // ignore the rest of code in the while loop and start from the top
        }

        if (choosenIDs.includes(file.question_id)){
          // console.log("there is a duplicate as we chose this a while ago");
          // if there is a duplicate then go onto the next file
          continue;
        }

        // in the event the for of loop goes to its end
        // then we can know for sure the random question is "new to the user"


        // run some checks to see if the file we got meets our specification
        // from the main query String of the URL
        // there is a restriction on the difficulty level, it has to be what the user passed in
        if (req.query.category == 0 && req.query.difficulty != 0){

          if (file["difficulty"] == categoryDifficultyConverter["difficulty"][req.query.difficulty]){
            // console.log("category == 0 and difficulty != 0");
            questionsArray.push(file);
            questionsIDArray.push(file.question_id);
            choosenIDs.push(file.question_id);
            count ++;
          }

          // there is a restriction on the category, it has to be what the user passed in
        } else if (req.query.difficulty == 0 && req.query.category != 0){

          if (file["category"] == categoryDifficultyConverter["category"][req.query.category]){
            // console.log("category != 0 and difficulty == 0");
            questionsArray.push(file);
            questionsIDArray.push(file.question_id);
            choosenIDs.push(file.question_id);
            count ++;
          }

          // there is no restrictions on both the category and difficulty level so just add whatever file gets called randomly
        } else if (req.query.category == 0 && req.query.difficulty == 0){
          // console.log("category == 0 and difficulty == 0");
          questionsArray.push(file);
          questionsIDArray.push(file.question_id);
          choosenIDs.push(file.question_id);
          count ++;

          // there is restrictions on both the category or difficulty
        } else if (file["category"] == categoryDifficultyConverter["category"][req.query.category] && file["difficulty"] == categoryDifficultyConverter["difficulty"][req.query.difficulty]){
          // console.log("category != 0 and difficulty != 0");
          questionsArray.push(file);
          questionsIDArray.push(file.question_id);
          choosenIDs.push(file.question_id);
          count ++;
        } // end

      } else {
        continue; // if the file doesn't exist then just go onto the next file in the for loop
      } // end of if the file exists if

      if (count == userQuota){
        break;
      }

    } // end of for file loop

    // take the Session ID file we just found and push to it the new array of questions we just generated

    let jsonFileName2 = path.join(".", config.sessionDir, token + config.sessionFileType);

    // checks if the session exist
    if (fs.existsSync(jsonFileName2)){

      let rJsonFile2 = fs.readFileSync(jsonFileName2);
      let overWrittenId = JSON.parse(rJsonFile2);

      // takes the ids from the question we just added and push them to the session .json file
      for (id of questionsIDArray){
        overWrittenId["questions"].push(id);
      }
      // writes the file to the server's directory
      // I hope this rewrites the JSON file
      fs.writeFileSync(path.join(".", config.sessionDir, token + config.sessionFileType), JSON.stringify(overWrittenId));

      // keep this out of the while loop
      // prints the objects
      // console.log("questionsArray here =>  " +  questionsArray);

      if (count == userQuota){
        // we got the amt the user wanted
        // we are good
        responseObject["status"] = 0;
        responseObject["results"] = questionsArray;
        // console.log("End result = 0");

      } else if (count < userQuota){
        // the amount we got is less than what the user wanted so we
        // have a response code 1 case
        responseObject["status"] = 1;
        responseObject["results"] = questionsArray;

        // console.log("End result = 1");
      } // end count < userQuota

      // if 200 send the object in the response body
      res.status(200).send(responseObject);
      next();

    } // end of if the file existsSync

  }); // end of read files in folder

} // end of getQuestions



app.listen(3000);
console.log("Server listening at http://localhost:3000");
