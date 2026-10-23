const express = require('express');
const path = require('path');
const app = express();
const puerto = 3000;


app.use(express.static(path.join(__dirname, 'public')));

// si entran a la raíz, los mando al inicio
app.get('/', (req, res) => {
    res.redirect('/pages/index.html');
});

app.listen(puerto, () => {
    console.log(`Servidor escuchando en http://localhost:${puerto}`);
});