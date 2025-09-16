import { Router } from 'express';
import { registrarChatPorToken, generarLinkTelegram } from '../controllers/telegram/telegramController';
import { cambiarContraseña } from '../controllers/usuarios/usuariosController';//mover a userRoutes luego

const router = Router();

router.post("/registrar-chat-token", registrarChatPorToken); //se usa dentro de back
router.post("/generar-link-telegram", generarLinkTelegram);
router.post('/cambiar-password', cambiarContraseña)

export default router;