//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb+srv://admin-nitin:123@cluster0.06t3p.mongodb.net/todolistDB', {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	}
});

const Item = mongoose.model('item', itemSchema);

const item1 = new Item({
	name: 'Welcome to your todo list'
});

const item2 = new Item({
	name: 'Hit the + button to start off a new item'
});

const item3 = new Item({
	name: '<--- Hit this to delete an item'
});

const defaultItems = [ item1, item2, item3 ];

const listSchema = {
	name: {
		type: String,
		required: true
	},
	items: [ itemSchema ]
};

const List = mongoose.model('List', listSchema);

app.get('/', function(req, res) {
	Item.find({}, (err, foundItems) => {
		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, (err) => {
				if (err) {
					console.log(err);
				} else {
					console.log('Successfully saved all the items');
				}
			});
			res.redirect('/');
		} else {
			res.render('list', { listTitle: 'Today', newListItems: foundItems });
		}
	});
});

const emptyList = [];

app.get('/:customListName', (req, res) => {
	const customListName = _.capitalize(req.params.customListName);

	if (customListName === 'Favicon.ico') return;

	List.findOne({ name: customListName }, (err, foundList) => {
		if (!err) {
			if (!foundList) {
				//Create a new list
				const list = new List({
					name: customListName,
					items: emptyList
				});
				list.save(() => {
					console.log(`Saved new list: ${customListName}`);
					res.redirect('/' + customListName);
				});
			} else {
				//Show an existing list
				res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
			}
		}
	});
});

app.post('/', function(req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName
	});

	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, (err, foundList) => {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', (req, res) => {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, (err) => {
			if (!err) {
				console.log('Successfully deleted checked item');
				res.redirect('/');
			}
		});
	} else {
		List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
			if (!err) {
				res.redirect('/' + listName);
			}
		});
	}
});

app.get('/work', function(req, res) {
	res.render('list', { listTitle: 'Work List', newListItems: workItems });
});

app.get('/about', function(req, res) {
	res.render('about');
});

app.listen(3000, function() {
	console.log('Server started on port 3000');
});
