const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;

// ajout de socket.io
const server = require('http').Server(app)
const io = require('socket.io')(server)

dotenv.config()
const fs = require('fs');
const dbName = 'artisans';
const numRegex = /^\d+$/;
const stringRegex = /^[a-zA-Z ]+$/;
const client = new MongoClient('mongodb://localhost:27017');

let Products;


client.connect(function (err) {
    if (err) throw err;

    const db = client.db(dbName);
    Products = db.collection('Products')
    console.log(db)
    Products.count(function (err, count) {
        if (!err && count === 0) {
            const data = fs.readFileSync('storage/Products.json');
            const docs = JSON.parse(data.toString());

            Products
                .insertMany(docs, function (err, result) {
                    if (err) throw err;
                    console.log('Inserted docs:', result.insertedCount);
                    client.close();
                });
        }
    });

});

/*
const products = [
    { "_id": 1, "name": "AC1 Phone1", "type": "phone", "price": 200.05, "rating": 3.8, "warranty_years": 1, "available": true },
    { "_id": 2, "name": "AC2 Phone2", "type": "phone", "price": 147.21, "rating": 1, "warranty_years": 3, "available": false },
    { "_id": 3, "name": "AC3 Phone3", "type": "phone", "price": 150, "rating": 2, "warranty_years": 1, "available": true },
    { "_id": 4, "name": "AC4 Phone4", "type": "phone", "price": 50.20, "rating": 3, "warranty_years": 2, "available": true }
]
*/

const findProductById = id => Products.findOne({ _id: id }, function (err, result) {
    if (err) throw err;
    db.close();
    return result;
});

const getAllProducts = () => Products.find();

io.on("connection", function (socket) {
    console.log(`Connected to client ${socket.id}`)

    socket.on("get-products", function (data) {
        socket.broadcast.emit("products", data);
    });

    socket.on("add-product", function (data) {
        socket.broadcast.emit("products", data);
    });

    socket.on("delete-product", function (data) {
        socket.broadcast.emit("products", data);
    });

    socket.on("update-product", function (data) {
        socket.broadcast.emit("products", data);
    });

    socket.on("disconnect", () => {
        activeUsers.delete(socket.userId);
        socket.broadcast.emit("user disconnected", socket.userId);
    });
});


server.listen(3000, function () {
    console.log('App is ready on localhost:3000')
})

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', function (req, res, next) {
    const token = req.headers['authorization']

    if (token == null) return res.status(401).send('Not authorized')

    jwt.verify(token, process.env.JWT_SECRET, err => {
        console.log(err)
        if (err) return res.status(403).send('Access forbidden')
        next()
    })
});

app.get('/', function (req, res) {
    res.json({ error: "No method" });
});

app.get('/getAll', function (req, res) {
    result = getAllProducts();
    if (result) {
        io.emit('products', result);
        res.json(result);
    }
    else
        res.status(400).json({ 'message': 'Bad request' });
    res.status(200).json({ 'message': 'success' });
});

app.use('/add', function (req, res) {
    const id = Products.find().sort({ _id: -1 }).limit(1).pretty() + 1;

    const name = req.body?.name;
    const type = req.body?.type;
    const price = req.body?.price;
    const rating = req.body?.rating;
    const warranty_years = req.body?.warranty_years;
    const available = req.body?.available == "true" ? true : req.body?.available == "false" ? false : req.body?.available;

    if (stringRegex.test(name) && stringRegex.test(type) && price >= 0 && rating >= 0 && rating <= 5 && warranty_years >= 0 && (available === true || available === false)) {
        Products.insertOne({ id, name, type, price, rating, warranty_years, available }, function (err, res) {
            if (err) throw err;
            db.close();
        });
        res.status(200).json({ 'message': 'success' });
    }
    else
        res.status(400).json({ 'message': 'Bad request' });

});

app.get('/:id/get', function (req, res) {
    const id = req.params.id;
    if (numRegex.test(id)) {
        const product = findProductById(id)
        if (product)
            res.status(200).json(product);
        else res.status(404).json({ 'message': 'Not found' }); ls
    } else
        res.status(400).json({ 'message': 'Bad request' });
    // res.json(product || { 'message': 'No user found with this id' });
});

app.use('/:id/edit', function (req, res) {
    const id = req.params.id;
    if (numRegex.test(id)) {
        const product = findProductById(id);
        if (product) {
            const name = req.body?.name;
            const type = req.body?.type;
            const price = req.body?.price;
            const rating = req.body?.rating;
            const warranty_years = req.body?.warranty_years;
            const available = req.body?.available == "true" ? true : req.body?.available == "false" ? false : req.body?.available;

            if (stringRegex.test(name) && stringRegex.test(type) && price >= 0 && rating >= 0 && rating <= 5 && warranty_years >= 0 && (available === true || available === false)) {
                product.name = name;
                product.type = type;
                product.price = price;
                product.rating = rating;
                product.warranty_years = warranty_years;
                product.available = available;

                Products.updateOne({ id: id }, { $set: product }, function (err, res) {
                    if (err) throw err;
                    res.status(200).json({ 'message': 'success' });
                    db.close();
                });

            }
            else
                res.status(400).json({ 'message': 'Bad request' });
        } else
            res.status(404).json({ 'message': 'Not found' });
    } else
        res.status(400).json({ 'message': 'Bad request' });

});

app.use('/:id/delete', function (req, res) {

    const id = req.params.id;
    if (numRegex.test(id)) {
        const product = findProductById(id)
        if (product) {
            Products.deleteOne({ id: id }, function (err, obj) {
                if (err) throw err;
                res.status(200).json({ 'message': 'success' });
                db.close();
            });
        } else
            res.status(404).json({ 'message': 'Not found' });
    } else
        res.status(400).json({ 'message': 'Bad request' });

});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;