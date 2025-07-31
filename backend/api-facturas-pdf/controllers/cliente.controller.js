import sql from 'mssql';
import dbConfig from '../config/database.js';
import axios from 'axios';
//const cliente = require('../models/cliente');
const clienteController = {};


clienteController.getFacturasPorNroServicio = async (req, res) => {

    try {
        const nroservicio = req.params.nroservicio
        if (nroservicio && nroservicio.toString().length <= 6) {
            // Connect to the database
            await sql.connect(dbConfig);


            // Cliente SQL Query
            const cliente_request = new sql.Request()
            cliente_request.input('nroservicio', sql.Int, nroservicio)
            const cliente_query = `select CliDiv, CliLocC, CliCta, CliSta, CliDig, CliFbj from CLIENTES where CliSerId = @nroservicio`
            const cliente_resultado = (await cliente_request.query(cliente_query)).recordset[0];
            console.dir(cliente_resultado);

            if(cliente_resultado['CliFbj'] == 0){
                let time = new Date();
                if (time.getMonth() < 6) {
                    time.setMonth(time.getMonth() + 5);
                    time.setFullYear(time.getFullYear() - 1);
                } else {
                    time.setMonth(time.getMonth() - 6);
                }
    
                // Convert to ISO string format
                let formattedTime = time.toISOString().slice(0, 19).replace('T', ' ');
    
                //Liquida SQL Query
                const liquida_query = `
                    SELECT LiqNro, LiqTpo FROM LIQUIDA 
                    WHERE LiqCliDiv = @CliDiv 
                    AND LiqCliLocC = @CliLocC 
                    AND LiqCliCta = @CliCta 
                    AND LiqCliSta = @CliSta 
                    AND LiqCliDig = @CliDig 
                    AND (LiqTpo = 'L' OR LiqTpo = 'N' OR LiqTpo = 'F') 
                    AND (LiqTco <> 'C' OR LiqTco <> 'P') 
                    AND (LiqFecPgo = 0 OR BcoCod = 0) 
                    AND LiqFec >= @LiqFec
                `;
                
                const liquida_request = new sql.Request();
                liquida_request.input('CliDiv', sql.Int, cliente_resultado['CliDiv']);
                liquida_request.input('CliLocC', sql.Int, cliente_resultado['CliLocC']);
                liquida_request.input('CliCta', sql.Int, cliente_resultado['CliCta']);
                liquida_request.input('CliSta', sql.Int, cliente_resultado['CliSta']);
                liquida_request.input('CliDig', sql.Int, cliente_resultado['CliDig']);
                liquida_request.input('LiqFec', sql.Date, formattedTime);
                
                const liquida_resultados = (await liquida_request.query(liquida_query)).recordset;
                console.dir(liquida_resultados);

                let cantidadFacturas = 0;
                for (let i = 0; i < liquida_resultados.length; i++) {
                    cantidadFacturas++;
                }
                const respuestaArchivo = await axios.get(`http://181.10.177.162:1085/aliquidacionesprintAPSJ.aspx?${liquida_resultados[0]['LiqNro']},${liquida_resultados['LiqTpo']}`, { responseType: 'arraybuffer' });
                const archivoPdfBase64 = Buffer.from(respuestaArchivo.data).toString('base64');
                console.log("Generando archivo PDF en base 64");
                const respuesta = {
                    archivo: archivoPdfBase64,
                    'msg': 'Tiene ' + cantidadFacturas + ' facturas pendientes de pago'
                };
                res.status(200).json(respuesta);

            } else {
                res.status(200).json({
                    'status': '0',
                    'msg': 'El Cliente es inactivo'
                });
            }
        } else {
            console.error('Error de parametro');
            res.status(400).json({
                'status': '4',
                'err': 'Revisar el parametro ingresado y su longitud debe ser menor a 7'
            })
        }
    } catch (err) {
        // Handle errors
        console.error('Error al realizar consulta:', err);
        res.status(500).json({
            'status': '5',
            'err': err
        })
    } finally {
        // Close the connection when done
        sql.close();
    }
    return res
}

clienteController.getFacturasPorNroCuenta = async (req, res) => {

    try {
        const CliDiv = req.params.CliDiv
        const CliLocC = req.params.CliLocC
        const CliCta = req.params.CliCta
        const CliSta = req.params.CliSta
        const CliDig = req.params.CliDig

        if (CliDiv && CliLocC && CliCta && CliSta && CliDig) {
            // Connect to the database
            await sql.connect(dbConfig);


            // Cliente SQL Query
            const cliente_request = new sql.Request()
            cliente_request.input('CliDiv', sql.Int, CliDiv)
            cliente_request.input('CliLocC', sql.Int, CliLocC)
            cliente_request.input('CliCta', sql.Int, CliCta)
            cliente_request.input('CliSta', sql.Int, CliSta)
            cliente_request.input('CliDig', sql.Int, CliDig)
            const cliente_query = `select CliFbj from CLIENTES where CliDiv = @CliDiv and CliLocC = @CliLocC and CliCta = @CliCta and CliSta = @CliSta and CliDig = @CliDig`
            const cliente_resultado = (await cliente_request.query(cliente_query)).recordset[0];
            console.dir(cliente_resultado);

            if(cliente_resultado['CliFbj'] == 0){
                let time = new Date();
                if (time.getMonth() < 6) {
                    time.setMonth(time.getMonth() + 5);
                    time.setFullYear(time.getFullYear() - 1);
                } else {
                    time.setMonth(time.getMonth() - 6);
                }
    
                // Convert to ISO string format
                let formattedTime = time.toISOString().slice(0, 19).replace('T', ' ');
    
                //Liquida SQL Query
                const liquida_query = `
                    SELECT TOP 10 LiqNro, LiqTpo FROM LIQUIDA 
                    WHERE LiqCliDiv = @CliDiv 
                    AND LiqCliLocC = @CliLocC 
                    AND LiqCliCta = @CliCta 
                    AND LiqCliSta = @CliSta 
                    AND LiqCliDig = @CliDig 
                    AND (LiqTpo = 'L' OR LiqTpo = 'N' OR LiqTpo = 'F') 
                    AND (LiqTco <> 'C' OR LiqTco <> 'P') 
                    AND (LiqFecPgo = 0 OR BcoCod = 0) 
                    AND LiqFec >= @LiqFec
                `;
                
                const liquida_request = new sql.Request();
                liquida_request.input('CliDiv', sql.Int, CliDiv);
                liquida_request.input('CliLocC', sql.Int, CliLocC);
                liquida_request.input('CliCta', sql.Int, CliCta);
                liquida_request.input('CliSta', sql.Int, CliSta);
                liquida_request.input('CliDig', sql.Int, CliDig);
                liquida_request.input('LiqFec', sql.Date, formattedTime);
                
                const liquida_resultados = (await liquida_request.query(liquida_query)).recordset;
                console.dir(liquida_resultados);

                let cantidadFacturas = 0;
                for (let i = 0; i < liquida_resultados.length; i++) {
                    cantidadFacturas++;
                }
                const respuestaArchivo = await axios.get(`http://181.10.177.162:1085/aliquidacionesprintAPSJ.aspx?${liquida_resultados[0]['LiqNro']},${liquida_resultados['LiqTpo']}`, { responseType: 'arraybuffer' });
                const archivoPdfBase64 = Buffer.from(respuestaArchivo.data).toString('base64');
                console.log("Generando archivo PDF en base 64");
                const respuesta = {
                    archivo: archivoPdfBase64,
                    'msg': 'Tiene ' + cantidadFacturas + ' facturas pendientes de pago'
                };

                res.status(200).json(respuesta);
                } else {
                    res.status(200).json({
                        'status': '0',
                        'msg': 'El Cliente es inactivo'
                    });
                }

        } else {
            console.error('Error de parametros');
            res.status(400).json({
                'status': '4',
                'err': 'Revisar el parametros ingresados'
            })
        }
    } catch (err) {
        // Handle errors
        console.error('Error al realizar consulta:', err);
        res.status(500).json({
            'status': '5',
            'err': err
        })
    } finally {
        // Close the connection when done
        sql.close();
    }
    return res
}
    
export default clienteController;

//clifbj = 0 -> cliente activo
//cliserid = nro de servicio
//si tiene mas de 2 deudas pendientes, que devuelva ademas un mensaje que indique la cantidad de deudas y que debe venir presencial o ver por la pagina al link X