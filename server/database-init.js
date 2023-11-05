//Import mongoose module
import pkg from 'mongoose';

const { connect, connection } = pkg;

//importing collections
import Pages from './collections/pages.js';
import Pages2 from './collections/pages2.js';

//loading the data
const loadData = async () => {
	
	//Connect to the mongo database.
  	await connect('mongodb://127.0.0.1:27017/lab3');

	//Remove database and start a new one
	await connection.dropDatabase();

	await Pages.create();
    await Pages2.create();

}

//Call to load the data
loadData()
  .then((result) => {
	console.log("Closing database connection.");
 	connection.close();
  })
  .catch(err => console.log(err));