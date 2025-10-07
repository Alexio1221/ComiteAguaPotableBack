import express from 'express';
import dotenv from 'dotenv'; 
import usuarios from './routes/userRoutes';
import telegram from './routes/telegramRoutes';
import sesion from './routes/sesionRoutes'
import avisosNoticias from './routes/avisosNoticiasRoutes';
import cors from 'cors';
import cookieParser from "cookie-parser";
import path from 'path'
import { iniciarBot } from './bot';

dotenv.config(); 

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // dirección de tu frontend Next.js
  credentials: true, // necesario para enviar y recibir cookies
}));

const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());

app.use('/auth', usuarios);
app.use('/api', telegram);
app.use('/sesion', sesion);
app.use('/avisos', avisosNoticias);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

iniciarBot();

app.get('/', (_req, res) => {
  res.send('Servidor corriendo 🎉');
});

/*Local*/ 
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
/*Network
app.listen(5000, "0.0.0.0", () => {
  console.log("Servidor escuchando en http://0.0.0.0:5000");
});*/