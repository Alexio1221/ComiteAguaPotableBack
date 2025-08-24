import express from 'express';
import dotenv from 'dotenv'; 
import usuarios from './routes/userRoutes';
import cors from 'cors';

dotenv.config(); 

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // dirección de tu frontend Next.js
  credentials: true, // necesario para enviar y recibir cookies
}));

const PORT = process.env.PORT || 3001;
app.use(express.json());

app.use('/auth', usuarios);

app.get('/', (_req, res) => {
  res.send('Servidor corriendo 🎉');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
