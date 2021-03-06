const MgrDbConnect = require("../managers/MgrDbConnection.js");
const mysql = require("mysql");

class QueryEngine{

	constructor(){}

	//Executes the given query with the given parameters
	//@Query is the sql statement
	//@parameters is an array of parameters to map the query to DEFAULT VALUE is an empty array
	//@Returns a promise and when it resolves it'll return the result/error
	executeQuery(query,parameters=[]){

		query = mysql.format(query,parameters); //Inserts the Parameters in the SQL statement
		//dgcreati_test2, &q)YB]y86?g&, dgcreati_quintessentiel
		let dbConnector = new MgrDbConnect("localhost","root","","quintessentiel");

		return new Promise(function(resolve,reject){

			dbConnector.connection.query(query,function(err,result){
				
				dbConnector.connection.end(); //Ends the connection

				if(!err){
					resolve(result);
				}
				else{
					resolve(err);
				}

			});

		});

	}
}

module.exports = QueryEngine