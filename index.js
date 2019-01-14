let exp = require('express'),
    app = exp(),
    q = require('./lib/query.js'),
    rq = require('./lib/refer-query.js');

app.use(exp.static('public'));
app.get('/rq', (req, res) => {
    // console.log(`Query: ${JSON.stringify(req.query)}`);
    rq.search(req.query, (err, data) => {
        if (err) throw err;
        res.send(JSON.stringify(data));
    });
});
app.get('/q', (req, res) => {
    // console.log(`Query: ${JSON.stringify(req.query)}`);
    q.search(req.query, (err, data) => {
        if (err) throw err;
        res.send(JSON.stringify(data));
    });
});

app.listen(3000, () => console.log("Server starts."));