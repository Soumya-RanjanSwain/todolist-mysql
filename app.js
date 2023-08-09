const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const connection = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  database: 'todolistDB'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

const itemsTable = 'items';
const listsTable = 'lists';

const createListsTableQuery = `
  CREATE TABLE IF NOT EXISTS ${listsTable} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
  )
`;

connection.query(createListsTableQuery, (err) => {
  if (err) {
    console.error('Error creating lists table:', err);
  }
});


const createItemsTableQuery = `
  CREATE TABLE IF NOT EXISTS ${itemsTable} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    list_id INT,
    FOREIGN KEY (list_id) REFERENCES ${listsTable}(id)
  )
`;

connection.query(createItemsTableQuery, (err) => {
  if (err) {
    console.error('Error creating items table:', err);
  }
});
connection.query(`INSERT INTO lists (name, id) VALUES ("Today", 0)`,(err) => {
  if (err) {
    console.log(err)}
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const selectQuery = `SELECT * FROM ${listsTable} WHERE name = ?`;

  connection.query(selectQuery, [customListName], (err, results) => {
    if (err) {
      console.error(err);
      return;
    }

    if (results.length === 0) {
      const insertQuery = `INSERT INTO ${listsTable} (name) VALUES (?)`;

      connection.query(insertQuery, [customListName], (err) => {
        if (err) {
          console.error(err);
          return;
        }

        res.redirect('/' + customListName);
      });
    } else {
      const listId = results[0].id;
      const selectItemsQuery = `SELECT * FROM ${itemsTable} WHERE list_id = ?`;

      connection.query(selectItemsQuery, [listId], (err, items) => {
        if (err) {
          console.error(err);
          return;
        }

        res.render('list', { listTitle: customListName, newListItems: items });
      });
    }
  });
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  const deleteQuery = `DELETE FROM ${itemsTable} WHERE id = ?`;

  connection.query(deleteQuery, [checkedItemId], (err) => {
    if (err) {
      console.error(err);
    }

    if (listName === 'Today') {
      res.redirect('/');
    } else {
      res.redirect('/' + listName);
    }
  });
});

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const selectListQuery = `SELECT id FROM ${listsTable} WHERE name = ?`;

  connection.query(selectListQuery, [listName], (err, results) => {
    if (err) {
      console.error(err);
      return;
    }

    if (results.length === 0) {
      return;
    }

    const listId = results[0].id;
    const insertItemQuery = `INSERT INTO ${itemsTable} (name, list_id) VALUES (?, ?)`;

    connection.query(insertItemQuery, [itemName, listId], (err) => {
      if (err) {
        console.error(err);
        return;
      }

      if (listName === 'Today') {
        res.redirect('/');
      } else {
        res.redirect('/' + listName);
      }
    });
  });
});

app.get('/', function (req, res) {
  const selectItemsQuery = `SELECT * FROM ${itemsTable} WHERE list_id = 1`;

  connection.query(selectItemsQuery, (err, foundItems) => {
    if (err) {
      console.error(err);
      return;
    }

    if (foundItems.length === 0) {
      const defaultItems = [
        { name: 'Welcome to your to-do list', list_id: 1},
        { name: 'Hit the + button to add a new item', list_id: 1 },
        { name: '<-- Hit this to delete an item', list_id: 1 }
      ];

      const insertDefaultItemsQuery = `INSERT INTO ${itemsTable} (name, list_id) VALUES (?, ?)`;

      defaultItems.forEach(item => {
        connection.query(insertDefaultItemsQuery, [item.name, item.list_id], (err) => {
          if (err) {
            console.error(err);
          }
        });
      });

      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newListItems: foundItems });
    }
  });
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
