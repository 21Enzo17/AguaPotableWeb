import { Router } from 'express';
import clienteController from '../controllers/cliente.controller.js'

const router = Router();

router.get('/servicio/:nroservicio', clienteController.getFacturasPorNroServicio);
router.get('/cuenta/:CliDiv-:CliLocC-:CliCta-:CliSta-:CliDig', clienteController.getFacturasPorNroCuenta);

export default router;