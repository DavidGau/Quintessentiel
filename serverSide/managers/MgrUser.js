const bcrypt = require('bcrypt');
const QueryEngine = require("../scripts/QueryEngine.js");
const uuidv4 = require('uuid/v4');
const nodemailer = require('nodemailer');

class MgrUser{

	constructor(){
		this._queryEngine = new QueryEngine();
	}

	//Calls the dbManager to add
	//the given user in the database
	//after verifying if the email already exists
	//@userObj is the userObject containing
	//all of it's infos
	//@Returns a promise
	addUser(userObj)
	{
		let hash = bcrypt.hashSync(userObj.password, 10);

		let selectUniqueEmailQuery = "SELECT id FROM Users WHERE email = ?";
		let paramUniqueEmail = [userObj.email];
		let currentQueryEngine = this._queryEngine;
		console.log("ADDDING THIS USER")
		console.log(userObj);
		return this._queryEngine.executeQuery(selectUniqueEmailQuery,paramUniqueEmail).then(function(result){
			console.log(result)
			if(result.length == 0) //The given email isnt already in the DB
			{
				let query = "INSERT INTO Users (idCivility,firstName,lastName,email,birthDate,password,newsletter,isAdmin,street,noApp,postalCode,noCivic,idCountry,idProvince) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
				let param = [userObj.idCivility,userObj.firstName,userObj.lastName,userObj.email,userObj.birthDate,hash,userObj.newsletter,userObj.isAdmin,userObj.street,userObj.noApp,userObj.postalCode,userObj.noCivic,userObj.idCountry,userObj.idProvince];

				return currentQueryEngine.executeQuery(query,param).then(function(test){
					console.log(test);
				});
			}
			else{ //This email is already in the DB
				return 1;
			}
		});
	}


	//Checks if the given credentials
	//are valid and if so, connect the
	//user
	//@userObj is the userObject containing
	//@checkForAdmin is a bool that checks if the user wants to connect as an admin
	//its credentials
	//@Returns a promise
	connectUser(userObj,checkForAdmin)
	{
		let query = "SELECT id,password FROM Users WHERE email = ? AND isAdmin = ?";

		let isAdmin = 0;

		if(checkForAdmin){
			isAdmin = 1;
		}

		let param = [userObj.email,isAdmin];


		return this._queryEngine.executeQuery(query,param).then(function(results){

			if(results.length > 0) //If there's at least one row for this email
			{
				if(bcrypt.compareSync(userObj.password, results[0].password)) { //Password match
					return [true,results[0].id];
				} else { //Password don't match
					return [false];
				}	
			}
			else{
				return [false]; //Email doesnt exist
			}



		});
	}

	/* 
		Checks if the user exists and if so,
		returns its ID
	*/
	checkIfUserExists(email){
		let query = "SELECT id FROM Users WHERE email = ?";
		let param = [email];


		return this._queryEngine.executeQuery(query,param).then(function(result){
			return result[0];
		});
	}


	/*
		Recovers the user password
		by creating a unique link
		and sending the user this link */
	recoverPassword(email){
		
		let idUser;
		let currentQueryEngine = this._queryEngine;
		let uniqueKey;

		return this.checkIfUserExists(email).then(function(userId){ //Checks if user exists and if so, return a new promise
			if(userId != undefined){
				idUser = userId.id;

				//Remove the last attempts to recover the password
				let outdatePrecedentRecoverQuery = "UPDATE Users_ResetCode SET codeDate = '1900-01-01' WHERE idUser = ?"
				let paramOutDate = [idUser];

				return currentQueryEngine.executeQuery(outdatePrecedentRecoverQuery,paramOutDate);
			}
			else{ //The email doesnt exist
				console.log("The user doesnt exist");
				throw false;
			}
		})
		.then(function(res){ //Inserts the new reset key linked to the user
			uniqueKey = uuidv4();

			let newResetCodeQuery = "INSERT INTO Users_ResetCode (idUser,ResetCode) VALUES(?,?)";
			let paramCode = [idUser,uniqueKey];

			return currentQueryEngine.executeQuery(newResetCodeQuery,paramCode);
		})
		.then(function(res){ //Sending the email with this generated key
			let link = "http://localhost:8000/recoverPassword?secretId="+uniqueKey;

			let transporter = nodemailer.createTransport({
			  service: 'gmail',
			  auth: {
			    user: 'projetwebquintessentiel@gmail.com',
			    pass: 'Pr0jetWeb'
			  }
			});

			var mailOptions = {
			  from: 'projetwebquintessentiel@gmail.com',
			  to: email,
			  subject: 'Quintessentiel | Récupération de mot de passe',
			  text: 'Une procédure de récupération de mot de passe a été entreprise pour votre compte sur notre site web. Si vous êtes au courant de cette procédure veuillez cliquer sur le lien suivant afin de réinitialiser votre mot de passe: '+link
			};

			transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
			    throw false;
			  }
			});

			return true;
		})
		.catch(function(err){
			return false;
		});



	}



	/*
		Recovering the user's password by
		changing it if it has a valid key 
		@Returns a promise chain
	*/
	recoveringPassword(newPassword,secretCode){
		let userId;
		let codeDate;

		let getUserIdBySecretCodeQuery = "SELECT idUser,codeDate FROM Users_ResetCode WHERE ResetCode = ?";
		let getUserIdBySecretCodeParam = [secretCode];

		let currentQueryEngine = this._queryEngine;

		return currentQueryEngine.executeQuery(getUserIdBySecretCodeQuery,getUserIdBySecretCodeParam)
		.then(function(res){
			if(res != undefined && res.length > 0){ 
				userId = res[0].idUser;
				codeDate = res[0].codeDate;

				let linkDate = new Date(codeDate)
				let currentDate = Date.now();

				let timeBetween = ((Math.floor(currentDate - linkDate) / 1000) / 60);

				if(timeBetween < 30){ //Less than 30 minutes
					let queryChangePassword = "UPDATE Users SET password = ? WHERE id = ?"
					let hash = bcrypt.hashSync(newPassword, 10);
					let paramChangePassword = [hash,userId];

					return currentQueryEngine.executeQuery(queryChangePassword,paramChangePassword);
				}
				else{ //More than 30 minutes, the link is invalid
					throw '1';
				}
				
			}
			else{ //This code doesnt exist
				throw '2';
			}
		})
		.then(function(res){ //The user's password has been changed
			return '0';
		})
		.catch(function(err){ //The user cannot change his password
			return err;
		});

	}


	/* Retrieves the user email that
		belongs to this code
		@code is the code from which we'll retreive the user's email
		@Returns a promise
	*/
	retreiveEmailByRecoverCode(code){

		let query = "SELECT email FROM Users INNER JOIN Users_ResetCode ON Users.id = Users_ResetCode.idUser WHERE Users_ResetCode.resetCode = ?";
		let param = [code];

		return this._queryEngine.executeQuery(query,param);
	}


		/*
	  Loads all the civilities
	  @Returns a promise
	*/
	loadAllCivilities(){

		let query = "SELECT * FROM ta_civilityattribute_language WHERE idLanguage = ?"
		let param = [1];
 

		return this._queryEngine.executeQuery(query,param);
	}


	/*
	 Loads all the conditions
	 @Returns a promise
	 */
	loadAllConditions()
	{
		let query = "SELECT idConditions,value FROM ta_conditionsattribute_language WHERE idLanguage = ?";
		let param = [1];


		return this._queryEngine.executeQuery(query,param);
	}


	/* Adds conditions to a specific user 
		@Returns a promise
	*/
	addConditionsToUser(userId, conditions)
	{
		let currentQueryEngine = this._queryEngine;

		return new Promise((resolve, reject) => { //Waits till all the conditions have been inserted
			let query = "INSERT INTO TA_users_conditions VALUES (DEFAULT,?,?)";
			let param;

			for(let i = 0;i < conditions.length;i++) //Inserts all the conditions linked to the user
			{
				param = [userId,conditions[i]];
				currentQueryEngine.executeQuery(query,param);
			}

			resolve(1);
		});

	}
}


module.exports = MgrUser;