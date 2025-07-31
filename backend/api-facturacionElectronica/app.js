import express from 'express'
import cors from 'cors'
import suscripcionRouter from './routers/suscripcion.routes.js'

const app = express();
const version = 'v1';

app.use(express.json());
app.use(cors({origin: 'http://localhost:4200'}));

app.use(`/facturacionElectronica/${version}`, suscripcionRouter);

app.get("*", (req, res, next) => { 
    res.status(404).send("PAGE NOT FOUND"); 
});

app.set('port', process.env.API_PORT || 3001);

app.listen(app.get('port'), () => {
    console.log(`Server listening on port ${app.get('port')}`);
})