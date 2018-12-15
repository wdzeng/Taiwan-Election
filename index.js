let exp = require('express');
let app = exp();

app.use(exp.static('public_html'));
app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.listen(3000, () => console.log("Server starts."))