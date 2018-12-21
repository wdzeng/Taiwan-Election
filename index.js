let exp = require('express');
let app = exp();

let q = require('./lib/query.js');

app.use(exp.static('public'));
app.get('/q', (req, res) => {
    q.search(req.query, (err, data) => {
        if (err) throw err;
        res.send(JSON.stringify(data));
    });
});
app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.listen(3000, () => console.log("Server starts."));