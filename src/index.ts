import express from 'express';
import dotenv from 'dotenv'; 
import usuarios from './routes/userRoutes';
import telegram from './routes/telegramRoutes';
import sesion from './routes/sesionRoutes'
import avisosNoticias from './routes/ReunionesAvisosNoticiasRoutes';
import mapa from './routes/mapaRoutes';
import servicios from './routes/serviciosRoutes';
import cors from 'cors';
import cookieParser from "cookie-parser";
import path from 'path'
import { iniciarBot } from './bot';

dotenv.config(); 

const app = express();

app.use(cors({
  origin: 'http://192.168.100.87:3000', 
  //origin: 'http://localhost:3000',
  credentials: true, // necesario para enviar y recibir cookies
}));

//const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(express.json());
app.use(cookieParser());

app.use('/auth', usuarios);
app.use('/api', telegram);
app.use('/sesion', sesion);
app.use('/avisos', avisosNoticias);
app.use('/mapa', mapa);
app.use('/servicios', servicios)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

iniciarBot();

app.get('/', (_req, res) => {
  res.send('Servidor corriendo 🎉');
});

/*Local*/ 
/*app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});*/
//Celular
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});

/*Network
app.listen(5000, "0.0.0.0", () => {
  console.log("Servidor escuchando en http://0.0.0.0:5000");
});*/