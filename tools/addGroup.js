const MongoClient = require('mongodb').MongoClient;
const csv_parse = require("csv-parse/lib/sync");

const option = require("../option");

(async () => {
	await MongoClient.connect(option.url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	}).then(d => global.__database = d.db('groups')).catch(e => {
		console.log("DB Connection Fail");
		console.log(e);
		process.exit(0);
	});

	//TODO: 동아리 추가
})();
