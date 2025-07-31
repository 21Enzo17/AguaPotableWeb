import { Router } from 'express';
import suscripcionController from '../controllers/suscripcion.controller.js'

const router = Router();

router.get('/suscribirse/:nroservicio-:email', suscripcionController.suscribirse);
router.get('/desuscribirse/:nroservicio', suscripcionController.desuscribirse);

export default router;