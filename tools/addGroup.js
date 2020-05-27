const MongoClient = require('mongodb').MongoClient;
const csv_parse = require("csv-parse/lib/sync");
const fs = require("fs");

const option = require("../option");

const readline = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});

const remove = true;
new Promise(async (r) => await MongoClient.connect(option.url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(d => global.__database = d.db('groups')).catch(e => {
	console.log("DB Connection Fail");
	console.log(e);
	process.exit(0);
}).finally(() => r())).then(async () => {
	if (remove) {
		await new Promise(r => readline.question("삭제 작업을 진행하시겠습니까? (confirm 입력): ", async (ans) => {
			if (ans.trim() === "confirm") {
				await __database.collection('group').deleteMany({});
			}
			r();
		}));
	}

	await new Promise(r => readline.question("동아리 추가 작업을 진행하시겠습니까? (confirm 입력): ", async (ans) => {
		if (ans.trim() !== "confirm") {
			process.exit(0);
		}
		r();
	}));

	let group_list = csv_parse(fs.readFileSync(__dirname + "/group_list.csv"), {
		skip_empty_lines: true,
		trim: true
	}).slice(1), id = -1;

	(await __database.collection('group').find({}).toArray()).forEach(v => id = Math.max(id, parseInt(v.id)));
	for (let data of group_list) {
		await __database.collection('group').insertOne({
			id: ++id,
			name: data[0],
			available: parseInt(data[1])
		});
	}

	console.log('Success!');
	process.exit(0);
});
