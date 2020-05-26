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
				await __database.collection('student').deleteMany({});
			}
			r();
		}));
	}

	await new Promise(r => readline.question("학생 추가 작업을 진행하시겠습니까? (confirm 입력): ", async (ans) => {
		if (ans.trim() !== "confirm") {
			process.exit(0);
		}
		r();
	}));

	let student_list = csv_parse(fs.readFileSync(__dirname + "/student.csv"), {
		skip_empty_lines: true,
		trim: true
	}).slice(1);

	for (let data of student_list) {
		/*await __database.collection('group').insertOne({
			id: ++id,
			name: data[0],
			available: parseInt(data[1])
		});*/
		//console.log(data)
		if (data[2].trim() !== '') {
			await __database.collection('student').insertOne({
				id: 999,
				name: data[1],
				num: data[0],
				registerTime: 0
			});

			console.log(data)
		}
	}

	console.log('Success!');
	process.exit(0);
});
