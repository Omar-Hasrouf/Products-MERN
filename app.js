const app = require("express")()
const PORT = process.env.PORT || 7000

app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/product', require('./routes/product'));

app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`)
})
