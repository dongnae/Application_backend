const express = require('express');
const router = express.Router();

router.post('/groups', async function (req, res) {
	try{
		res.header("Content-Type", "application/json; charset=utf-8");
		res.status(200);
		res.end(JSON.stringify({
			status: 0,
			result: (await __database.collection('group').find({}).toArray()).map(v => {
				if (v._id !== undefined) delete v._id;
				return v;
			})
		}));
	}catch (e) {
		res.status(500);
		res.end(JSON.stringify({
			status: 1
		}));
	}
});

router.post('/application', async function (req, res) {
	try{
		res.header("Content-Type", "application/json; charset=utf-8");

		let num = req.body.num, name = req.body.name, group = req.body.group;
		if (typeof num !== "string" || typeof name !== "string" || !Number.isSafeInteger(group)) {
			res.status(403);
			res.end(JSON.stringify({
				status: 1
			}));
			return;
		}

		if (!__student.filter(v => v[0] === num && v[1] === name).length) {
			res.status(200);
			res.end(JSON.stringify({
				status: 2,
				message: "이름 또는 학번이 잘못되었습니다.",
				groups: (await __database.collection('group').find({}).toArray()).map(v => {
					if (v._id !== undefined) delete v._id;
					return v;
				})
			}));
			return;
		}

		if (await __database.collection('student').findOne({num: num, name: name}) !== null) {
			res.status(200);
			res.end(JSON.stringify({
				status: 3,
				message: "이미 동아리에 신청하였습니다."
			}));
			return;
		}

		let selectedGroup = await __database.collection('group').findOne({id: group});
		if (selectedGroup === null) {
			res.status(403);
			res.end(JSON.stringify({
				status: 4
			}));
			return;
		}

		if (!selectedGroup.available) {
			res.status(200);
			res.end(JSON.stringify({
				status: 5,
				message: "선택한 동아리의 모집이 마감되었습니다.\n다른 동아리를 선택해주세요.",
				groups: (await __database.collection('group').find({}).toArray()).map(v => {
					if (v._id !== undefined) delete v._id;
					return v;
				})
			}));
			return;
		}

		let studentQuery = await __database.collection('student').insertOne({num: num, name: name, groupId: group, registerTime: parseInt(Date.now() / 1000)});
		let groupQuery = await __database.collection('group').updateOne({id: group}, {
			$set: {
				available: selectedGroup.available - 1
			}
		});

		if (studentQuery.insertedCount === 1 && groupQuery.modifiedCount === 1) {
			res.status(200);
			res.end(JSON.stringify({
				status: 0
			}));
		}else{
			res.status(500);
			res.end(JSON.stringify({
				status: 6
			}));
		}
	}catch (e) {
		res.status(500);
		res.end(JSON.stringify({
			status: 7
		}));
	}
});

router.use((req, res) => {
	res.status(405);
	res.end("<h1>405 Method Not Allowed</h1>")
});

module.exports = router;
