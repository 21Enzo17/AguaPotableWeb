import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  EVENTS,
} from "@builderbot/bot";
import { MemoryDB as Database } from "@builderbot/bot";
import { utils } from "@builderbot/bot";
import { MetaProvider as Provider } from "@builderbot/provider-meta";
import fs from "fs";
import path from "path";
const PORT = process.env.PORT ?? 3008;
import dbLocal from "db-local";

import { base64ToPdf } from "./utils/pdfUtils.js";
import { nroservice } from "./utils/pdfUtils.js";
import { iniciar, reiniciar, flujoInactividad } from "./utils/idle-custom.js";
import {
  iniciar2,
  reiniciar2,
  flowSatisfaccion,
  flowverificacion,
} from "./utils/satisfaction.js";

const flow = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    "Por favor, ingresa tu número de Servicio:",
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      await state.update({ numSer: ctx.body });
      await flowDynamic(
        "Gracias por proporcionar tu número de Servicio. Ahora, te enviaré el archivo."
      );
    }
  )
  .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
    const numSer = state.get("numSer");

    if (!numSer) {
      return await flowDynamic([
        {
          body: "No recibí un número de servicio válido. Por favor, intenta de nuevo.",
        },
      ]);
    }

    try {
      const filePath = await base64ToPdf(numSer);  // Ahora filePath tendrá la URL
      await flowDynamic([{ body: `Aquí tienes tus deudas: (${filePath})` }]);
      await flowDynamic([{ body: "Gracias por usar nuestros servicios." }]);
    } catch (error) {
      await flowDynamic([
        {
          body: "Hubo un problema. Por favor, intenta más tarde.",
        },
      ]);
    }

    return gotoFlow(flowPrincipal);
  });

const flowFacturasOpcion1 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "💳 Podés abonar las facturas en las oficinas de Agua Potable o en entidades habilitadas.",
      "También podés abonar tus facturas por transferencia bancaria",
      "\n*¿Desea Abonar su factura por transferencia bancaria? Si/No*",
    ],
    { capture: true, buttons: [{ body: "Si" }, { body: "No" }] },
    (ctx, { fallBack, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      switch (ctx.body) {
        case "Si":
          return gotoFlow(flowtranferencia);
        case "No":
          return gotoFlow(flowPrincipal);
        default:
          return fallBack();
      }
    }
  );

const flowFacturasOpcion2 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "📄 Si no recibiste tu factura, podés imprimirla desde www.aguapotablejujuy.com con tu número de usuario.",
      "También podés acercarte a las oficinas para solicitar una copia de 07:00 a 16:00 hs. O usar la opción 5 para ver las Facturas adeudadas.",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const rutaBase = "./informes/facturas";

async function leerMensajeOperador(nroServicio) {
  try {
    const rutaCarpetaUsuario = path.join(rutaBase, nroServicio);

    const fechaActual = new Date();
    const nombreCarpetaFecha = `${fechaActual.getDate()}-${fechaActual.getMonth() + 1}-${fechaActual.getFullYear()}`;
    const rutaCarpetaFecha = path.join(rutaCarpetaUsuario, nombreCarpetaFecha);

    if (!fs.existsSync(rutaCarpetaFecha)) {
      fs.mkdirSync(rutaCarpetaFecha, { recursive: true });
    }

    const rutaArchivoTxt = path.join(rutaCarpetaFecha, "mensaje.txt");

    if (!fs.existsSync(rutaArchivoTxt)) {
      console.log(
        `No existe archivo para el usuario con número de servicio: ${nroServicio}`
      );

      const mensajePredeterminado =
        "Esperando la revisión del operador. No hay mensaje disponible aún.";
      fs.writeFileSync(rutaArchivoTxt, mensajePredeterminado, "utf8");
      console.log(
        `Archivo creado con mensaje predeterminado para el usuario con número de servicio: ${nroServicio}`
      );
    }

    const mensaje = fs.readFileSync(rutaArchivoTxt, "utf8").trim();

    if (!mensaje) {
      console.log(
        `El archivo del usuario con número de servicio ${nroServicio} está vacío.`
      );
      return null;
    }

    return mensaje;
  } catch (error) {
    console.error("Error al leer el archivo:", error);
    return null;
  }
}

const flowtranferencia = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "💳 Podrás abonar tu factura por transferencia bancaria.",
      "Para realizar el pago, deberas transferir el importe de tu factura a los siguientes datos bancarios de Agua Potable:",
      "CBU:50200930094144962721",
      "Alias: aguapotable.rec",
      "Una vez realizada la transferencia debera informar algunos datos.",
    ],
    {
      media: "./images/transferencia.png",
    }
  )
  .addAnswer(
    "*¿Ya realizo la transferencia? Si/No* ",
    { capture: true, buttons: [{ body: "Si" }, { body: "No" }] },
    async (ctx, { fallBack, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      switch (ctx.body) {
        case "Si":
          return gotoFlow(flowtranferenciadatos);
        case "No":
          return gotoFlow(flowFacturasOpcion1);
        default:
          return fallBack();
      }
    }
  );

const comprobante = addKeyword(EVENTS.DOCUMENT, { delay: 2000 }).addAnswer(
  "Ingrese su comprobante de pago",
  { capture: true },
  async (ctx, { provider, state, flowDynamic, gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);

    const nroServicio = state.get("nroServicio");

    try {
      if (!nroServicio) {
        console.error("No se ha recibido un número de usuario.");
        return;
      }

      const rutaCarpetaUsuario = path.join(rutaBase, nroServicio);

      if (!fs.existsSync(rutaCarpetaUsuario)) {
        fs.mkdirSync(rutaCarpetaUsuario, { recursive: true });
      }

      const fechaActual = new Date();
      const nombreCarpeta = `${fechaActual.getDate()}-${
        fechaActual.getMonth() + 1
      }-${fechaActual.getFullYear()}`;
      const rutaCarpetaComprobante = path.join(
        rutaCarpetaUsuario,
        nombreCarpeta
      );
      if (!fs.existsSync(rutaCarpetaComprobante)) {
        fs.mkdirSync(rutaCarpetaComprobante, { recursive: true });
      }

      const rutaArchivo = path.join(rutaCarpetaComprobante);

      const tempFile = await provider.saveFile(ctx, { path: rutaArchivo });

      const ext = path.extname(tempFile).toLowerCase();
      if (ext !== ".pdf") {
        await flowDynamic(
          "Solo se aceptan archivos PDF. Por favor, sube un archivo en formato PDF."
        );
        fs.unlinkSync(tempFile);
        return gotoFlow(comprobante);
      }

      await flowDynamic("*Comprobante Recibido, lo revisaremos en breve*");
      await flowDynamic("*Devolviendo al Menu*");
      return gotoFlow(flowPrincipal);
    } catch (error) {
      console.error("Error al guardar el archivo:", error);
    }
  }
);

const flowOpciones = addKeyword(EVENTS.ACTION, { delay: 2000 }).addAnswer(
  [
    "💧 *Opciones disponibles*",
    "1️⃣ Ver el proceso de tu pago",
    "2️⃣ Cargar tu comprobante de pago",
    "Por favor, elige una opción (1 o 2):",
  ],
  { capture: true, buttons: [{ body: "1" }, { body: "2" }] },
  async (ctx, { fallBack, gotoFlow, state, flowDynamic }) => {
    const nroServicio = state.get("nroServicio");

    switch (ctx.body.trim()) {
      case "1": {
        const mensajeOperador = await leerMensajeOperador(nroServicio);
        if (mensajeOperador) {
          await flowDynamic(`💬 *Mensaje del Operador:* ${mensajeOperador}`);
        } else {
          await flowDynamic(
            "No hay información disponible sobre el proceso de pago en este momento."
          );
          return gotoFlow(flowtranferencia);
        }
        return gotoFlow(flowPrincipal);
      }

      case "2": {
        return gotoFlow(comprobante);
      }

      default:
        return fallBack();
    }
  }
);

const flowtranferenciadatos = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    "📄 Ingresa tu número de servicio para continuar",
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      const nroServicio = ctx.body.trim();
      await state.update({ nroServicio });

      return gotoFlow(flowOpciones);
    }
  );

const flowFacturasOpcion4 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "Sí, puedes pagar la factura vencida en las oficinas de agua potable. Si la factura es unificada (con varios servicios), se recomienda evitar pagar cerca de la fecha de corte para prevenir inconvenientes. El personal de caja te asesorará al momento de realizar el pago.",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowFacturas = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    {
      capture: false,
    },
    async (ctx, { provider }) => {
      const list = {
        header: {
          type: "text",
          text: "",
        },
        body: {
          text: "*En la Seccion de Facturas encontraras diferente informacion para pagar tus facturas, consultar tardanzas y ver las facturas adeudadas:*\n\n*Selecciona una opcion*",
        },
        footer: {
          text: "\nSeleciona tu opción para continuar.",
        },
        action: {
          button: "Opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                {
                  id: "1",
                  title: "Pagar Factura",
                  description: "Donde puedo pagar mi factura.",
                },
                {
                  id: "2",
                  title: "Tardanza de Facturas",
                  description: "Tardanza de Facturas.",
                },
                {
                  id: "3",
                  title: "Numero de Usuario.",
                  description: "Numero de Usuario.",
                },
                {
                  id: "4",
                  title: "Pagar Factura Vencida",
                  description: "Se puede pagar factura vencida.",
                },
                {
                  id: "5",
                  title: "Consulta de Deudas",
                  description: "Como puedo consultar si tengo deudas.",
                },
                {
                  id: "6",
                  title: "Menu Principal",
                },
              ],
            },
          ],
        },
      };
      await provider.sendList(ctx.from, list);
    }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "1":
        return gotoFlow(flowFacturasOpcion1);
      case "2":
        return gotoFlow(flowFacturasOpcion2);
      case "3":
        return gotoFlow(flowInformacionOpcion3);
      case "4":
        return gotoFlow(flowFacturasOpcion4);
      case "5":
        return gotoFlow(flow);
      case "6":
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  });

const flowReclamosOpcion1 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "🚱 Para reclamos por falta de agua:",
      "1º – Antes de realizar un reclamo por falta de agua deberá verificar que la llave de paso esté abierta.",
      "2º – Controlar desde una canilla que entre directamente desde la red de distribución que efectivamente no tenga agua.",
      "\n- En caso de confirmar la falta de agua podrás dejar asentado tu reclamo con el mensaje Falta de agua y los siguientes datos: Número de usuario y Documento.",
      "*Ingrese el numero de usuario*",
    ],
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      await state.update({ usuario: ctx.body });
      await flowDynamic("ingrese una descripcion para su reclamo");
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const descripcion = ctx.body;
      await state.update({ descripcion: descripcion });
      await flowDynamic(
        "ingrese la ubicacion exacta de su reclamo. Ej: Calle 123, Barrio Alto Comedero"
      );
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const ubicaciontxt = ctx.body;
      const nrousuario = state.get("usuario");
      const descripcion = state.get("descripcion");

      const baseDirectory = "./informes/reclamos/falta_de_agua";

      let reportCount = 1;
      while (
        fs.existsSync(path.join(baseDirectory, `reclamo_${reportCount}`))
      ) {
        reportCount++;
      }

      const directoryPath = path.join(baseDirectory, `reclamo_${reportCount}`);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      const usuarioFilePath = path.join(directoryPath, "reclamo.txt");
      fs.writeFileSync(
        usuarioFilePath,
        `Reclamo:\nNumero de usuario: ${nrousuario}, \n Descripcion: ${descripcion},\n ubicacion: ${ubicaciontxt}`,
        "utf8"
      );
      console.log("Reclamo guardado en:", usuarioFilePath);

      await state.update({ directoryPath });

      await flowDynamic("*Reclamo recibido*");
      return gotoFlow(flowPrincipal);
    }
  );

const flowReclamosOpcion2 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer([
    "💧 Para reclamos por baja presión, ",
    "deja tu reclamo con tu número de Usuario",
    "\n*Ingrese el numero de usuario*",
  ])
  .addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
    const nrousuario = ctx.body;
    await state.update({ nrousuario: nrousuario });
    await flowDynamic(
      "ingrese la ubicacion exacta de su reclamo. Ej: Calle 123, Barrio Alto Comedero"
    );
  })
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const ubicaciontxt = ctx.body;
      const nrousuario = state.get("nrousuario");
      console.log("numero de usuario recibido:", nrousuario);

      const baseDirectory = "./informes/reclamos/baja_presion";

      let reportCount = 1;
      while (
        fs.existsSync(path.join(baseDirectory, `reclamo_${reportCount}`))
      ) {
        reportCount++;
      }

      const directoryPath = path.join(baseDirectory, `reclamo_${reportCount}`);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      const usuarioFilePath = path.join(directoryPath, "reclamo.txt");
      fs.writeFileSync(
        usuarioFilePath,
        `Reclamo reportada: ${nrousuario}, \n Ubicacion: ${ubicaciontxt}`,
        "utf8"
      );
      console.log("Reclamo guardado en:", usuarioFilePath);

      await state.update({ directoryPath });

      await flowDynamic("*Reclamo recibido*");
      return gotoFlow(flowPrincipal);
    }
  );

const flowReclamosOpcion3 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer([
    "🚰 Para reclamos por alto consumo, ",
    "🚰 Si tienes dudas sobre un alto consumo, ingrese su reclamo con el numero de Usuario para realizar una verificación del medidor.",
    "\n*Ingrese el numero de usuario*",
  ])
  .addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
    const nrousuario = ctx.body;
    await state.update({ nrousuario: nrousuario });
    await flowDynamic("ingrese la ubicacion");
  })
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const ubicacionLa = ctx.latitude;
      const ubicacionLo = ctx.longitude;
      const ubicaciontxt = ctx.body;
      const nrousuario = state.get("nrousuario");

      const baseDirectory = "./informes/reclamos/alto_consumo";

      let reportCount = 1;
      while (
        fs.existsSync(path.join(baseDirectory, `reclamo_${reportCount}`))
      ) {
        reportCount++;
      }

      const directoryPath = path.join(baseDirectory, `reclamo_${reportCount}`);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      const usuarioFilePath = path.join(directoryPath, "reclamo.txt");
      fs.writeFileSync(
        usuarioFilePath,
        `Reclamo reportada: ${nrousuario}, \n Ubicacion: ${ubicaciontxt}, \n Latitud: ${ubicacionLa}, \n Longitud: ${ubicacionLo}`,
        "utf8"
      );
      console.log("Reclamo guardado en:", usuarioFilePath);

      await state.update({ directoryPath });

      await flowDynamic("*Reclamo recibido*");
      return gotoFlow(flowPrincipal);
    }
  );

const flowReclamosOpcion4 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "🔧 Si tu medidor ha sido robado, debes presentar la exposición policial lo antes posible y luego comprar un medidor nuevo. A continuación, debes presentar el medidor ante agua potable para regularizar la situación.",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowReclamosOpcion5 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "Si necesitas hacer un reclamo relacionado con cambios de uso, debes presentarte en la oficina correspondiente con la documentación necesaria para proceder con la verificación y el ajuste en el sistema.",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowReclamosOpcion6 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "Si observas pérdidas o desperfectos en la red de distribución de agua, debes presentarte en la oficina correspondiente con la documentación necesaria para proceder con la verificación y el ajuste en el sistema.",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowReclamosOpcion7 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "Si su Reclamo no se encontraba en la lista de opciones anterior puede ingresar su reclamo aqui y lo revisaremos pronto",
      "*Ingrese que quiere reclamar (Titulo)*",
    ],
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      await state.update({ reclamo: ctx.body });
      await flowDynamic("ingrese el contenido de su reclamo");
    }
  )
  .addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
    await state.update({ reclamoD: ctx.body });
    await flowDynamic("*ingrese la ubicacion*");
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
    const ubicacionLa = ctx.latitude;
    const ubicacionLo = ctx.longitude;
    const ubicaciontxt = ctx.body;
    const reclamo = state.get("reclamoD");
    const titleReclamo = state.get("reclamo");

    const baseDirectory = "./informes/reclamos/reclamos_Varios";

    let reportCount = 1;
    while (fs.existsSync(path.join(baseDirectory, `reclamo_${reportCount}`))) {
      reportCount++;
    }

    const directoryPath = path.join(baseDirectory, `reclamo_${reportCount}`);

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const usuarioFilePath = path.join(directoryPath, "reclamo.txt");
    fs.writeFileSync(
      usuarioFilePath,
      `Reclamo:${titleReclamo}\n Ubicacion: ${ubicaciontxt}, \n Latitud: ${ubicacionLa}, \n Longitud: ${ubicacionLo}, \n Descripcion: ${reclamo}`,
      "utf8"
    );
    console.log("Reclamo guardado en:", usuarioFilePath);

    await state.update({ directoryPath });

    await flowDynamic("*Reclamo recibido*");
    await flowDynamic("*Volver al Menu*", {
      capture: true,
      buttons: [{ body: "Menu" }],
    });
  });

const flowReclamos = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    {
      capture: false,
    },
    async (ctx, { provider }) => {
      const list = {
        header: {
          type: "text",
          text: "",
        },
        body: {
          text: "*En la Seccion de Reclamos podras dejar por sentado tu reclamo por alto consumo, falta de agua, robo de medidor,etc. En caso de que su reclamo no se encuentre dentor del menu puede ingresar su reclamo en la Opcion 'Otro Reclamo' :*\n\n*Selecciona una opcion*",
        },
        footer: {
          text: "\nSeleciona tu opción para continuar.",
        },
        action: {
          button: "Opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                {
                  id: "1",
                  title: "Falta de Agua",
                  description: "Reclamo por falta de agua.",
                },
                {
                  id: "2",
                  title: "Baja presión",
                  description: "Reclamo por baja presión.",
                },
                {
                  id: "3",
                  title: "Alto consumo",
                  description: "Reclamo por alto consumo.",
                },
                {
                  id: "4",
                  title: "Robo de medidor",
                  description: "Reclamo por Robo de Medidor.",
                },
                {
                  id: "5",
                  title: "Cambios de uso",
                  description: "Reclamo por cambios de uso.",
                },
                {
                  id: "6",
                  title: "Red de distribución",
                  description:
                    "Reclamo por pérdidas o desperfectos en la red de distribución.",
                },
                {
                  id: "7",
                  title: "Otro Reclamo",
                  description:
                    "Elija esta opcion si su reclamo no esta en la lista",
                },
                {
                  id: "8",
                  title: "Menu Principal",
                },
              ],
            },
          ],
        },
      };
      await provider.sendList(ctx.from, list);
    }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "1":
        return gotoFlow(flowReclamosOpcion1);
      case "2":
        return gotoFlow(flowReclamosOpcion2);
      case "3":
        return gotoFlow(flowReclamosOpcion3);
      case "4":
        return gotoFlow(flowReclamosOpcion4);
      case "5":
        return gotoFlow(flowReclamosOpcion5);
      case "6":
        return gotoFlow(flowReclamosOpcion6);
      case "7":
        return gotoFlow(flowReclamosOpcion7);
      case "8":
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  });

const flowPerdidasOpcion1 = addKeyword(EVENTS.LOCATION, "Opcion 1", {
  delay: 2000,
})
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer([
    "🚰 Para reportar una pérdida de agua, cloaca o derroche incluye:",
    "-Ubicación exacta (si la pérdida es en calle o vereda).",
    "\n *Ingresa Ubicacion.*",
  ])
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const ubicacionLa = ctx.latitude;
      const ubicacionLo = ctx.longitude;
      const ubicaciontxt = ctx.body;
      console.log(
        "Ubicación recibida:",
        ubicacionLa,
        ubicacionLo,
        ubicaciontxt
      );

      const baseDirectory = "./informes/reportes/perdidas";

      let reportCount = 1;
      while (
        fs.existsSync(path.join(baseDirectory, `reporte_${reportCount}`))
      ) {
        reportCount++;
      }

      const directoryPath = path.join(baseDirectory, `reporte_${reportCount}`);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      const ubicacionFilePath = path.join(directoryPath, "ubicacion.txt");
      fs.writeFileSync(
        ubicacionFilePath,
        `Ubicación reportada: ${ubicacionLa}, ${ubicacionLo}, ${ubicaciontxt}`,
        "utf8"
      );
      console.log("Ubicación guardada en:", ubicacionFilePath);

      await state.update({ directoryPath });

      await flowDynamic("*Ubicación recibida*");
      return gotoFlow(flowReporte);
    }
  );

const flowReporte2 = addKeyword(EVENTS.MEDIA, { delay: 2000 }).addAnswer(
  "Ingrese la imagen o video",
  { capture: true },
  async (ctx, { provider, state, gotoFlow }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    const directoryPath = state.get("directoryPath");

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const localPath = await provider.saveFile(ctx, { path: directoryPath });
    console.log("Archivo multimedia guardado en:", localPath);

    return gotoFlow(flowreporte3);
  }
);

const flowReporte = addKeyword(EVENTS.ACTION, { delay: 2000 }).addAnswer(
  "¿Desea agregar imagen o video a su reporte?",
  { capture: true, buttons: [{ body: "Sí" }, { body: "No" }] },
  async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "Sí":
        return gotoFlow(flowReporte2);
      case "No":
        await flowDynamic("Reporte recibido");
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  }
);

const flowreporte3 = addKeyword(EVENTS.ACTION, { delay: 2000 }).addAnswer(
  "¿Desea subir otra imagen o video?",
  { capture: true, buttons: [{ body: "Sí" }, { body: "No" }] },
  async (ctx, { fallBack, gotoFlow, flowDynamic }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "Sí":
        return gotoFlow(flowReporte2);
      case "No":
        await flowDynamic("Reporte recibido");
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  }
);

const flowPerdidasOpcion2 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer([
    "🏚️ Si observas una pérdida en un predio abandonado:",
    "Comunicalo para que cerremos la llave maestra o realicemos la reparación.",
    "*Ingrese la ubicacion exacta de la perdida.*",
  ])
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const ubicacionLa = ctx.latitude;
      const ubicacionLo = ctx.longitude;
      const ubicaciontxt = ctx.body;

      if (ubicacionLa === "undefined" && ubicacionLo === "undefined") {
        console.log(ctx.body);
      }
      console.log("Ubicación recibida:", ubicacionLa, ubicacionLo);

      const baseDirectory =
        "./informes/reportes/Predios Abandonados";

      let reportCount = 1;
      while (
        fs.existsSync(path.join(baseDirectory, `reporte_${reportCount}`))
      ) {
        reportCount++;
      }

      const directoryPath = path.join(baseDirectory, `reporte_${reportCount}`);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      const ubicacionFilePath = path.join(directoryPath, "ubicacion.txt");
      fs.writeFileSync(
        ubicacionFilePath,
        `Ubicación reportada: ${ubicacionLa}, ${ubicacionLo}, ${ubicaciontxt}`,
        "utf8"
      );
      console.log("Ubicación guardada en:", ubicacionFilePath);

      await state.update({ directoryPath });

      await flowDynamic("*Ubicación recibida*");
      return gotoFlow(flowReporte);
    }
  );

const flowPerdidasOpcion3 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "🔧 Las pérdidas internas deben ser reparadas por el usuario. Agua Potable solo se encarga de pérdidas en la red pública. *Si es una perdida de la red publica vaya a la opcion 1 de perdidas*",
    ],
    { buttons: [{ body: "Menu" }, { body: "Opcion 1" }] }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "Opcion 1":
        return gotoFlow(flowPerdidasOpcion1);
      case "Menu":
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  });

const flowPerdidas = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    {
      capture: false,
    },
    async (ctx, { provider }) => {
      const list = {
        header: {
          type: "text",
          text: "",
        },
        body: {
          text: "*🙌 En la Seccion de Perdidas encontraras informacion para reportar o denunciar perdidas de agua:*\n\n*Selecciona una opcion*",
        },
        footer: {
          text: "\nSeleciona tu opción para continuar.",
        },
        action: {
          button: "Opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                {
                  id: "1",
                  title: "Reportar Perdida",
                  description: "Reportar Perdida o derroche de agua.",
                },
                {
                  id: "2",
                  title: "Denunciar Perdida",
                  description: "Denunciar Perdida en un predio abandonado.",
                },
                {
                  id: "3",
                  title: "Reparar Perdidas",
                  description: "Reparar Perdidas Internas.",
                },
                {
                  id: "4",
                  title: "Menu Principal",
                },
              ],
            },
          ],
        },
      };
      await provider.sendList(ctx.from, list);
    }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "1":
        return gotoFlow(flowPerdidasOpcion1);
      case "2":
        return gotoFlow(flowPerdidasOpcion2);
      case "3":
        return gotoFlow(flowPerdidasOpcion3);
      case "4":
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  });

const flowInformacionOpcion1 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "👥 *La atención al usuario se realiza principalmente de forma presencial.*",
      "🌐 *Puedes consultar también a través de la página web.*",
      "📲 *La atención por WhatsApp está disponible de lunes a viernes, de 07:00 a 14:00.*",
      "❌ *No se realiza atención telefónica directa.*"
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );
  

const flowInformacionOpcion2 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "🔒 *Solo el propietario registrado puede cambiar la titularidad.*",
      "📑 *Los documentos necesarios para cambiar la titularidad del servicio de agua son:*",
      "1️⃣ *Copia del DNI del titular del servicio.*",
      "2️⃣ *Ficha parcelaria actualizada (de los últimos 6 meses).*",
      "\n📄 *Si no eres el titular, debes presentar documentación que acredite la relación con el terreno:*",
      "- Boleta de compraventa",
      "- Tenencia precaria",
      "- Permiso de ocupación",
      "- Resolución del IVUJ",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowInformacionOpcion3 = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "🔢 Tu número de usuario se encuentra en la factura, en el margen derecho, a mitad de la boleta, con 14 dígitos.",
    ],
    {
      media: "./images/numero de usuario.png",
    }
  )
  .addAnswer("Verifícalo en tu Factura", {
    capture: true,
    buttons: [{ body: "Menu" }],
  });

const flowInformacion = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    {
      capture: false,
    },
    async (ctx, { provider }) => {
      const list = {
        header: {
          type: "text",
          text: "",
        },
        body: {
          text: "*En la Seccion de Informacion encontraras los horarios de atencion del servicio de agua, el cambio de titularidad.*  \n\n*Selecciona una Opcion*",
        },
        footer: {
          text: "\nSelecciona tu opción para continuar.",
        },
        action: {
          button: "Opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                {
                  id: "1",
                  title: "Horarios.",
                  description: "Horarios de atención.",
                },
                {
                  id: "2",
                  title: "Titularidad.",
                  description: "Cambio de titularidad.",
                },
                {
                  id: "3",
                  title: "Menu Principal.",
                },
              ],
            },
          ],
        },
      };
      await provider.sendList(ctx.from, list);
    }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);
    switch (ctx.body) {
      case "1":
        return gotoFlow(flowInformacionOpcion1);
      case "2":
        return gotoFlow(flowInformacionOpcion2);
      case "3":
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  });

const flowDesuscripcion = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer([
    "🔢 Puedes desuscribirte del servicio",
    "Desde tu correo puedes desuscribirte del servicio",
  ]);

const flowSuscripcion = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer([
    "🔢 Puedes suscribirte al servicio",
    "Ingrese su numero de documento sin puntos",
  ])
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);
      await state.update({ nroServicio: ctx.body });
      await flowDynamic("Por favor, ingresa tu correo electrónico:");
    }
  )
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);

      const nroServicio = state.get("nroServicio");
      const email = ctx.body;

      if (!validarCorreo(email)) {
        await flowDynamic(
          "El correo electrónico no tiene un formato válido o contiene caracteres no permitidos. Intenta nuevamente."
        );
        return gotoFlow(flowSuscripcion);
      }

      await flowDynamic("*Usted se ha suscrito al servicio*", {
        capture: true,
        buttons: [{ body: "Menu" }],
      });

      console.log(nroServicio, email);
      await nroservice(nroServicio, email);
    }
  );

function validarCorreo(correo) {
  const regex =
    /^(?![0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$)(?![0-9]+$)[a-zA-Z0-9._%+-]+@(gmail\.com|email\.com|yahoo\.com|outlook\.com|mail\.com)$/;
  return regex.test(correo);
}

const flowDebitoAutomatico = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "🔢 Para adherir las facturas al débito, podrás solicitarlo a la entidad bancaria o tarjeta de crédito en la cual desees realizar el débito automático.",
      "\n💡 Estas mismas facturas se distribuyen al cliente de acuerdo a lo que la empresa le factura.",
      "\n✅ Para corroborar el ingreso del débito, deberás controlar en el resumen mensual de tu tarjeta de crédito y/o en el extracto bancario de tu cuenta, donde se informan los servicios e importes debitados.",
      "\n⚙️ Estamos trabajando en esta funcionalidad para mejorar la experiencia de nuestros clientes.",
      "\n🏢 Dirígete a la oficina central para que un operador te ayude con el proceso. Horarios: de lunes a viernes de 8:00 a 15:00 hs.",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowConexiones = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "*✅ Documentación necesaria para la conexión de agua:*",
      "📄Formulario de conexión externa de agua presentado por un matriculado y firmado por el propietario del inmueble. Descargar Formulario- www.aguapotablejujuy.com/wp-content/uploads/2020/11/conexion-agua-y-cloaca.pdf",
      "📄 Libre deuda para CONEXIÓN DE AGUA de la cuenta del inmueble.",
      "📄 Documentación que demuestre la propiedad del inmueble (Escritura, Boleto Compra-Venta, Tenencia, Permiso de Ocupación).",
      "📄 Fotocopia DNI.",
      "📄 Fotocopia de la factura de energía.",
      "📄 Medidor de agua habilitado y la factura de compra.",
      "📄 Libre deuda del costeante de la obra de red de agua.",
      "📄 Abonar los aranceles.",
      "📄 Certificado de numeración municipal (en el caso que no cuente con numero domiciliario).",
      "📄 Plano de instalación y constancia del colegio profesional con incumbencia en la materia.",
      "📄 Presentar recibo y autorización de rotura y reposición de calzada (se debe tramitar en la Municipalidad).",
      "\n*Presentar Documentación en las oficinas de Agua Potable Jujuy.*",
    ],
    { capture: true, buttons: [{ body: "Menu" }] }
  );

const flowServicios = addKeyword(EVENTS.ACTION, { delay: 2000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer("")
  .addAnswer(
    {
      capture: false,
    },
    async (ctx, { provider }) => {
      const list = {
        header: {
          type: "text",
          text: "",
        },
        body: {
          text: "*En la Seccion de servicios encontraras informacion para adherirte al servicio de factura electronica, debito automatico y solicitar conexion a la red de agua:*\n\n*Selecciona una opcion*",
        },
        footer: {
          text: "\nSelecciona tu opción para continuar.",
        },
        action: {
          button: "Opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                {
                  id: "1",
                  title: "Suscripción",
                  description:
                    "Suscribirse al Servicio de facturacion electronica",
                },
                {
                  id: "2",
                  title: "Desuscripción",
                  description:
                    "Desuscribirse del Servicio de facturacion electronica",
                },
                {
                  id: "3",
                  title: "Débito Automático",
                  description: "Suscribirse al Débito Automático",
                },
                {
                  id: "4",
                  title: "Solicitar Conexión",
                  description: "Solicitar Conexión a la red de agua",
                },
                {
                  id: "5",
                  title: "Menu Principal",
                },
              ],
            },
          ],
        },
      };
      await provider.sendList(ctx.from, list);
    }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "1":
        return gotoFlow(flowSuscripcion);
      case "2":
        return gotoFlow(flowDesuscripcion);
      case "3":
        return gotoFlow(flowDebitoAutomatico);
      case "4":
        return gotoFlow(flowConexiones);
      case "5":
        return gotoFlow(flowPrincipal);
      default:
        return fallBack();
    }
  });

 const flowSalida = addKeyword(EVENTS.ACTION, { delay: 2000 })
 .addAction(async (ctx, { gotoFlow }) => {
   iniciar2(ctx, gotoFlow, 300000);
   iniciar(ctx, gotoFlow, 1800000);
 })
.addAnswer(
   [
    "Gracias por utilizar el servicio de Agua Potable Jujuy. 💧",
    "Recuerda que puedes seguir usando nuestro servicio en cualquier momento. ⏰",
    "Si tienes alguna duda o necesitas asistencia, no dudes en contactarnos. 📞",
    "¿Pudiste resolver tu problema? Responde con 'Sí' o 'No'. 🤔",
   ],
   { capture: true, buttons: [{ body: "si" }, { body: "no" }]}
 ).addAction(async (ctx, { flowDynamic, fallBack, endFlow }) => {
  switch (ctx.body) {
    case "si":
      await flowDynamic("¡Nos alegra saber que pudiste resolver tu problema! 🎉\nGracias por confiar en el servicio de Agua Potable Jujuy. 😊");
      return endFlow();
    case "no":
      await flowDynamic("Lamentamos que no hayas podido resolver tu problema. 😞\nPor favor, comunícate con nuestro número de atención: 0800-444-2633. 📞\nNuestro equipo estará encantado de ayudarte.");
      return endFlow();
    default:
      return fallBack();
  }}

);
const temporizadores = {};

const flowPrincipal = addKeyword([EVENTS.WELCOME, "0", "Menu"], { delay: 1000 })
  .addAction(async (ctx, { gotoFlow }) => {
    iniciar2(ctx, gotoFlow, 300000);
    iniciar(ctx, gotoFlow, 1800000);
  })
  .addAnswer(
    [
      "¡Hola! Soy Aguito, el Asistente Virtual de Agua Potable.🚰, \nRecuerda que no soy una persona real 🤖, por lo que debes ser específico con lo que me preguntas.\n\n¡Empecemos!",
    ],
    {
      media: "./images/gota.png",
    }
  )
  .addAnswer(
    {
      capture: false,
    },
    async (ctx, { provider, gotoFlow }) => {
      reiniciar2(ctx, gotoFlow, 300000);
      reiniciar(ctx, gotoFlow, 1800000);
      const list = {
        header: {
          type: "text",
          text: "",
        },
        body: {
          text: "*Selecciona una Opcion*",
        },
        footer: {
          text: "\nSelecciona tu opción para continuar.",
        },
        action: {
          button: "Opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                {
                  id: "1",
                  title: "Facturas",
                  description: "Consulta sobre facturas.",
                },
                {
                  id: "2",
                  title: "Reclamos",
                  description: "Realizar reclamos.",
                },
                {
                  id: "3",
                  title: "Pérdidas de agua",
                  description: "Información sobre pérdidas de agua.",
                },
                {
                  id: "4",
                  title: "Información general",
                  description: "Información general de atención.",
                },
                {
                  id: "5",
                  title: "Servicios",
                  description: "Suscripción a los Servicios.",
                },
                {
                  id: "6",
                  title: "Salir",
                  description: "Salir del Asistente Virtual.",
                },
              ],
            },
          ],
        },
      };
      await provider.sendList(ctx.from, list);
    },
    { delay: 2000 }
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow, fallBack }) => {
    reiniciar2(ctx, gotoFlow, 300000);
    reiniciar(ctx, gotoFlow, 1800000);

    switch (ctx.body) {
      case "1":
        return gotoFlow(flowFacturas);
      case "2":
        return gotoFlow(flowReclamos);
      case "3":
        return gotoFlow(flowPerdidas);
      case "4":
        return gotoFlow(flowInformacion);
      case "5":
        return gotoFlow(flowServicios);
      case "6":
        return gotoFlow(flowSalida);
      default:
        return fallBack();
    }
  });

export {
  flowPrincipal,
  flowServicios,
  flowPerdidas,
  flowFacturas,
  flowReclamos,
  flowPerdidasOpcion1,
  flowPerdidasOpcion2,
  flowPerdidasOpcion3,
  flowFacturasOpcion1,
  flowFacturasOpcion2,
  flowInformacionOpcion3,
  flowReclamosOpcion1,
  flowReclamosOpcion2,
  flowReclamosOpcion3,
  flowtranferencia,
  flowInformacion,
  flowInformacionOpcion1,
  flowInformacionOpcion2,
  //flowInformacionOpcion3,
  flow,
  flowReclamosOpcion4,
  flowReclamosOpcion5,
  flowReclamosOpcion6,
  flowtranferenciadatos,
  flowOpciones,
  comprobante,
  flowSuscripcion,
  flowReporte,
  flowReporte2,
  flowreporte3,
  flowDesuscripcion,
  flowReclamosOpcion7,
  flujoInactividad,
  flowDebitoAutomatico,
  flowConexiones,
  temporizadores,
};

const main = async () => {
  const adapterProvider = createProvider(Provider, {
    jwtToken: process.env.JWT_TOKEN,
    numberId: process.env.NUMBER_ID,
    verifyToken: process.env.VERIFY_TOKEN,
    version: process.env.VERSION,
  });
  const adapterDB = new Database();

  const adapterFlow = createFlow([
    flowPrincipal,
    flowPerdidas,
    flowFacturas,
    flowReclamos,
    flowPerdidasOpcion1,
    flowPerdidasOpcion2,
    flowPerdidasOpcion3,
    flowFacturasOpcion1,
    flowFacturasOpcion2,
    flowInformacionOpcion3,
    flowReclamosOpcion1,
    flowReclamosOpcion2,
    flowReclamosOpcion3,
    flowtranferencia,
    flowInformacion,
    flowInformacionOpcion1,
    flowInformacionOpcion2,
    flowInformacionOpcion3,
    flow,
    flowOpciones,
    flowReclamosOpcion4,
    flowReclamosOpcion5,
    flowReclamosOpcion6,
    flowtranferenciadatos,
    comprobante,
    flowSuscripcion,
    flowReporte,
    flowReporte2,
    flowreporte3,
    flowDesuscripcion,
    flowServicios,
    flowReclamosOpcion7,
    flujoInactividad,
    flowDebitoAutomatico,
    flowConexiones,
    flowSatisfaccion,
    flowverificacion,
    flowSalida,
  ]);

  const { handleCtx, httpServer } = await createBot(
    {
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    },
    {
      queue: {
        timeout: 60000,
        concurrencyLimit: 500,
      },
    }
  );

  const { Schema } = new dbLocal({ path: "./databases" });

  const RegisteredPhones = Schema("RegisteredPhones", {
    _id: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
  });

  async function initializeDatabase() {
    const existingNumbers = await RegisteredPhones.find({});
    if (existingNumbers.length === 0) {
      await RegisteredPhones.create({
        _id: 1,
        phoneNumber: "5493888200392",
      }).save();
      await RegisteredPhones.create({
        _id: 2,
        phoneNumber: "5493884597687",
      }).save();
      console.log("Base de datos inicializada con números por defecto.");
    }
  }

  async function addPhoneNumber(phoneNumber) {
    const existingPhone = await RegisteredPhones.findOne({ phoneNumber });
    if (!existingPhone) {
      const newPhone = await RegisteredPhones.create({
        _id: Date.now(),
        phoneNumber,
      }).save();
      console.log(
        `Número ${phoneNumber} agregado a la base de datos.`,
        newPhone
      );
    } else {
      console.log(`El número ${phoneNumber} ya está registrado.`);
    }
  }

  async function removePhoneNumber(phoneNumber) {
    const phone = await RegisteredPhones.findOne({ phoneNumber });

    if (phone) {
      await RegisteredPhones.remove(phone);
      console.log(`Número ${phoneNumber} eliminado de la base de datos.`);
    } else {
      console.log(
        `El número ${phoneNumber} no se encuentra en la base de datos.`
      );
    }
  }

  async function getAllRegisteredPhones() {
    const phones = await RegisteredPhones.find({});
    return phones.map((phone) => phone.phoneNumber);
  }

  initializeDatabase();

  let flujoActivo = false;
  let mensajeParaEnviar = "";
  const numeroOrigenAutorizado = "5493884597687";

  adapterProvider.on("message", async ({ body, from }) => {
    const telefono = from;

    const registeredPhones = await getAllRegisteredPhones();
    if (!registeredPhones.includes(telefono)) {
      console.log(telefono, "No tienes permiso para enviar mensajes.", {});
      return;
    }

    if (telefono !== numeroOrigenAutorizado) {
      console.log(telefono, "No tienes permiso para enviar mensajes.", {});
      return;
    }

    if (body.toLowerCase() === "empezaraenviarmensajes5") {
      flujoActivo = true;
      console.log(`Flujo de mensajes activado para el número ${telefono}`);
      adapterProvider.sendMessage(
        telefono,
        "Flujo activado. Ahora, por favor ingresa el mensaje que deseas enviar a todos los usuarios.",
        {}
      );
      return;
    }

    if (body.toLowerCase() === "terminar") {
      flujoActivo = false;
      console.log(`Flujo de mensajes desactivado para el número ${telefono}`);
      adapterProvider.sendMessage(telefono, "Flujo desactivado.", {});
      return;
    }

    if (body.toLowerCase().startsWith("agregar ")) {
      const phoneToAdd = body.slice(8).trim();
      console.log(`Intentando agregar el número: ${phoneToAdd}`);
      await addPhoneNumber(phoneToAdd);
      adapterProvider.sendMessage(
        telefono,
        `Intentando agregar el número ${phoneToAdd}.`,
        {}
      );
      return;
    }

    if (body.toLowerCase().startsWith("eliminar ")) {
      const phoneToRemove = body.slice(9).trim();
      console.log(`Intentando eliminar el número: ${phoneToRemove}`);
      await removePhoneNumber(phoneToRemove);
      adapterProvider.sendMessage(
        telefono,
        `Intentando eliminar el número ${phoneToRemove}.`,
        {}
      );
      return;
    }

    if (flujoActivo) {
      if (mensajeParaEnviar === "") {
        mensajeParaEnviar = body.trim();
        adapterProvider.sendMessage(
          telefono,
          `Has ingresado el mensaje: "${mensajeParaEnviar}". Ahora se enviará a todos los números registrados.`,
          {}
        );

        const numerosRegistrados = await getAllRegisteredPhones();

        for (const numero of numerosRegistrados) {
          try {
            await adapterProvider.sendMessage(numero, mensajeParaEnviar, {});
            console.log(`Mensaje enviado a ${numero}: ${mensajeParaEnviar}`);
            await utils.delay(5000);
          } catch (error) {
            console.error(
              `Error al enviar mensaje a ${numero}: ${error.message}`
            );
          }
        }

        flujoActivo = false;
        mensajeParaEnviar = "";
        adapterProvider.sendMessage(
          telefono,
          "Mensaje enviado a todos los números registrados.",
          {}
        );
      }
    }
  });

  const chats = {};

  adapterProvider.on("message", ({ body, from }) => {
    const telefono = from;
    if (!chats[telefono]) {
      chats[telefono] = [];
    }
    chats[telefono].push(body);
    console.log(`Mensaje recibido de ${telefono}: ${body}`);
  });

  const getChat = (telefono) => {
    return chats[telefono];
  };

  const getListaMensajes = (telefono) => {
    const chat = getChat(telefono);
    return chat.map((mensaje) => mensaje.body);
  };

  const getListaUsuarios = () => {
    return Object.keys(chats);
  };

  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      if (!req.body.number || !req.body.message) {
        return res.status(400).end("Invalid request");
      }
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end("sended");
    })
  );

  adapterProvider.server.post(
    "/v1/register",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("REGISTER_FLOW", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/samples",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("SAMPLES", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/blacklist",
    handleCtx(async (bot, req, res) => {
      const { number, intent } = req.body;
      if (intent === "remove") bot.blacklist.remove(number);
      if (intent === "add") bot.blacklist.add(number);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", number, intent }));
    })
  );

  adapterProvider.server.post(
    "/v1/get-chat",
    handleCtx(async (bot, req, res) => {
      const telefono = req.body.telefono;
      const chat = getChat(telefono);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ chat }));
    })
  );

  adapterProvider.server.post(
    "/v1/get-lista-mensajes",
    handleCtx(async (bot, req, res) => {
      const telefono = req.body.telefono;
      const listaMensajes = getListaMensajes(telefono);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ listaMensajes }));
    })
  );

  adapterProvider.server.post(
    "/v1/get-lista-usuarios",
    handleCtx(async (bot, req, res) => {
      const listaUsuarios = getListaUsuarios();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ listaUsuarios }));
    })
  );

  httpServer(+PORT);
};

main();
