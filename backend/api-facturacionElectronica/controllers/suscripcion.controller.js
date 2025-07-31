import sql from 'mssql';
import dbConfig from '../config/database.js';
//const cliente = require('../models/cliente');
const suscripcionController = {};


suscripcionController.suscribirse = async (req, res) => {

    try {
        const nroservicio = req.params.nroservicio
        const email = req.params.email
        if (nroservicio && nroservicio.toString().length <= 8 && email) {
            if(email.includes('@') && email.includes('.com')){
                //Connect to the database
                await sql.connect(dbConfig);
                
                // Cliente SQL Query
                const cliente_request = new sql.Request()
                cliente_request.input('nroservicio', sql.Int, nroservicio)
                cliente_request.input('email', sql.VarChar, email)
                const cliente_query = `update CLIENTES set CliEmail = @email where CliSerId = @nroservicio`
                await cliente_request.query(cliente_query);
                res.status(200).json({
                    'status': '0',
                    'msg': 'El email ha sido actualizado. Recuerde informar de confirmar la suscripción del cliente desde el mensaje que le llegara a su correo'
                })
            } else {
                res.status(404).json({
                    'status': '4',
                    'msg': 'El email indicado no es valido'
                });
            }
        } else {
            console.error('Error de parametro');
            res.status(400).json({
                'status': '4',
                'err': 'Revisar los parametros parametro ingresados. El Número de servicio debe tener 7 digitos y debe proporcionar un correo'
            })
        }
    } catch (err) {
        // Handle errors
        console.error('Error al realizar transacción:', err);
        res.status(500).json({
            'status': '5',
            'err': err
        })
    } finally {
        // Close the connection when done
        sql.close();
    }
}

suscripcionController.desuscribirse = async (req, res) => {

    try {
        const nroservicio = req.params.nroservicio
        if (nroservicio && nroservicio.toString().length <= 6) {
            //Connect to the database
            await sql.connect(dbConfig);
            
            // Cliente SQL Query
            const cliente_request = new sql.Request()
            cliente_request.input('nroservicio', sql.Int, nroservicio)
            const cliente_query = `update CLIENTES set CliEmail = NULL where CliSerId = @nroservicio`
            await cliente_request.query(cliente_query);
            res.status(200).json({
                'status': '0',
                'msg': 'El cliente fue desadherido del servicio'
            })
            
        } else {
            console.error('Error de parametro');
            res.status(400).json({
                'status': '4',
                'err': 'Revisar los parametros parametro ingresados. El Número de servicio debe tener 7 digitos'
            })
        }
    } catch (err) {
        // Handle errors
        console.error('Error al realizar transacción:', err);
        res.status(500).json({
            'status': '5',
            'err': err
        })
    } finally {
        // Close the connection when done
        sql.close();
    }
}
    
export default suscripcionController;