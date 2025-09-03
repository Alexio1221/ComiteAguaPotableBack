import express from 'express';
import dotenv from 'dotenv'; 
import usuarios from './routes/userRoutes';
import cors from 'cors';
import cookieParser from "cookie-parser";

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