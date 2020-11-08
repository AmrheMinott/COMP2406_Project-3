# Project3
Handles incoming URL request from user and displays to user the unique questions (question never seen) from local files server



## ERROR when running the file.

	On a Mac PC there seems to be some strange file added automatically .DS_Store when this file is in the folder the functionality are not correct. Please delete such a file on your PC before running


AIM and focus of project: this project was designed to make request to a local host server to model the experience of getting unique questions to a user.

Analogy imagining going to a store that gives questions out for free but each question you get is unique (different) from any you have ever seen since being given questions from that store.

Additionally you are only given question when an ID//token is presented and you can specify various condition to your order of question such as the category of questions of which there are 24 to choose from even the difficulty and number of question you want.



## Query Parameters name for url textbox


	category -> is category of the question [0,24]
		questions?category=<insert category>

	limit -> is number of questions
		questions?limit=<insert limit>

	difficulty -> is difficult of question [0,3]
		questions?difficulty=<insert difficulty>

	token -> is the uuid of the session
		questions?token=<insert token>

questions?token=<insert token>&difficulty=<insert difficulty>&limit=<insert limit>&category=<insert category>



In the event the user has not specified a limit the default limit will be 10
If user has not specified category or difficulty then the behaviour will be random ie = 0
	or if the difficulty is over 3 then the difficulty will be a random number form [1 , 3]

### If the user goes over the range of values
	case 1 user sets query to ?difficulty= -10 &cat = -23
		for negative numbers the default value will be 0 which is means any file from the folder
		with difficulty 1 2 or 3
		So a random value of easy medium or hard is created

		category would be any category really

	case 2 user sets query to ?difficulty = 10000 || category == 100000
		for number positive but our of the range we set the parameter to the last value
		for difficulty that would be a – random number
		for category that would be a – random number

### PS once this number in generated it does not change unless a new request is made


	Case 3 all query parameters are null
		that includes:		token, difficulty, category and limit === NULL
		then 10 random questions are sent also not that these questions can be repeats

	in order to use difficulty, category and limit you MUST have a token ID


Make notice of an object called categoryDifficultyConverter
	– what this does is take the integer from the query for difficulty OR (||) category and checks if 	the file we got from the server is the same category

but these category values match with the value of the questions


This server does not accept strings being passed for category and difficulty and an error message will be sent to you the user indicating that they have a entered a string and need to redo their query statement

However if the user puts a string in for the limit that is accepted and we return 10 questions


## Status Codes Definitions

### Case of Status 0
		this means the quota the user asked for was met meaning if the asked for 10 questions of a certain category or difficulty and we have given them that in total then the status is success.

### Case of Status 1
		then in this case we give the user what we were able to gather from the collection of questions and return that.

### Case of Status 2
		user entered a token but is was wrong


end of README!
