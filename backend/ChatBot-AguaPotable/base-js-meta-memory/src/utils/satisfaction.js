import { addKeyword, EVENTS } from "@builderbot/bot";
import dbLocal from "db-local";
import { flowPrincipal } from "../app.js";

const { Schema } = new dbLocal({ path: "./databases" });

const Respuestas = Schema("Respuestas", {
  _id: { type: String, required: true },
  calificacion: { type: Number, required: true },
  sugerencia: { type: String, default: "Sin sugerencia" },
});

async function initializeDatabase() {
  const existingResponses = await Respuestas.find({});
  if (existingResponses.length === 0) {
    console.log("Base de datos de respuestas inicializada.");
  }
}

async function addResponse(userId, calificacion, sugerencia) {
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
    throw new Error("La calificación debe ser un número entre 1 y 5");
  }

  const existingResponse = await Respuestas.findOne({ _id: userId });

  if (!existingResponse) {
    const newResponse = await Respuestas.create({
      _id: userId,
      calificacion,
      sugerencia: sugerencia || "Sin sugerencia",
    }).save();
    console.log(`Respuesta de satisfacción agregada para el usuario ${userId}`);
    console.log(newResponse);
  } else {
    let updated = false;

    if (existingResponse.calificacion !== calificacion) {
      existingResponse.calificacion = calificacion;
      updated = true;
    }

    if (existingResponse.sugerencia !== sugerencia) {
      existingResponse.sugerencia = sugerencia || "Sin sugerencia";
      updated = true;
    }

    if (updated) {
      await existingResponse.save();
      console.log(
        `Respuesta de satisfacción actualizada para el usuario ${userId}`
      );
    } else {
      console.log(`No hubo cambios en la respuesta para el usuario ${userId}`);
    }
  }
}

async function getAllResponses() {
  const responses = await Respuestas.find({});
  return responses;
}

initializeDatabase();

const temporizadores = {};
let cronJob;

const iniciar2 = (ctx, gotoFlow, ms) => {
  detener2(ctx);

  temporizadores[ctx.from] = setTimeout(() => {
    console.log(`Tiempo de espera del usuario: ${ctx.from}`);
    return gotoFlow(flowverificacion);
  }, ms);
};

const reiniciar2 = (ctx, gotoFlow, ms) => {
  console.log(`Reiniciando temporizador para el usuario: ${ctx.from}`);

  detener2(ctx);

  if (temporizadores[ctx.from]) {
    clearTimeout(temporizadores[ctx.from]);
  }

  iniciar2(ctx, gotoFlow, ms);
};

const detener2 = (ctx) => {
  if (temporizadores[ctx.from]) {
    clearTimeout(temporizadores[ctx.from]);
  }

  if (cronJob) {
    cronJob.stop();
    console.log("Cron job detenido");
  }
};

const flowverificacion = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { endFlow, gotoFlow }) => {
    const allResponses = await getAllResponses();
    const existingResponse = allResponses.find(
      (response) => response._id === ctx.from
    );

    if (existingResponse) {
      console.log(`El usuario ${ctx.from} ya ha respondido anteriormente.`);
      return endFlow();
    } else {
      return gotoFlow(flowSatisfaccion);
    }
  }
);

const flowSatisfaccion = addKeyword(EVENTS.ACTION)
  .addAnswer(
    [
      "🌟 *¡Hola! Soy tu asistente virtual Aguito 😃* 🌟\n\n" +
        "💬 *Queremos saber tu opinión* 💬\n\n" +
        "📊 *¿Cómo calificarías tu experiencia con nuestro servicio?* ✨\n\n" +
        "1️⃣ *Muy Mala* 😞\n" +
        "2️⃣ *Mala* 😔\n" +
        "3️⃣ *Regular* 😐\n" +
        "4️⃣ *Buena* 🙂\n" +
        "5️⃣ *Excelente* 😄\n\n" +
        "⚡ Tu respuesta nos ayuda a mejorar, ¡gracias por tu tiempo! ⚡\n\n" +
        "👉 Si tienes algún comentario adicional o sugerencia, ¡estoy aquí para escucharte! 🙋‍♂️🙋‍♀️",
    ],
    { capture: false }
  )
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
                  title: "Muy Mala",
                  description: "Muy mala experiencia",
                },
                { id: "2", title: "Mala", description: "Mala experiencia" },
                {
                  id: "3",
                  title: "Regular",
                  description: "Experiencia regular",
                },
                { id: "4", title: "Buena", description: "Experiencia buena" },
                {
                  id: "5",
                  title: "Excelente",
                  description: "Experiencia excelente",
                },
                {
                  id: "Salir",
                  title: "Salir",
                  description: "Salir de la encuesta",
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
  .addAction(
    { capture: true },
    async (ctx, { flowDynamic, state, gotoFlow }) => {
      let calificacion = ctx.body.trim();

      if (calificacion === "Salir") {
        await flowDynamic(
          "¡Gracias por tu respuesta! Esperamos que vuelvas pronto."
        );
        return gotoFlow(flowPrincipal);
      }

      if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
        const mensajeError = `❌ *¡Ups! La calificación debe ser un número entre 1 y 5.*\nPor favor, selecciona una calificación válida.`;
        await flowDynamic(mensajeError);
        return;
      }

      calificacion = parseInt(calificacion);

      await state.update({ calificacion });

      const mensajeMejora =
        `🔧 *¡Gracias por calificar!* Ahora, ¿qué podríamos mejorar? 🛠️\n\n` +
        `Por favor, comparte cualquier sugerencia o comentario que tengas.`;

      await flowDynamic(mensajeMejora);
    }
  )

  .addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
    const sugerencia = ctx.body.trim() || "Sin sugerencia";
    const calificacion = state.get("calificacion");

    await addResponse(ctx.from, calificacion, sugerencia);

    const mensajeFinal =
      `✅ *Gracias por tus comentarios y sugerencias.*\n\n` +
      `Te agradecemos por ayudarnos a mejorar nuestros servicios. ¡Siempre estamos aquí para ayudarte! 🙏`;

    await flowDynamic(mensajeFinal, {
      capture: true,
      buttons: [{ body: "Menu" }],
    });

    console.log("Respuestas almacenadas: ", {
      calificacion: calificacion,
      sugerencia: sugerencia,
    });
  });

export { iniciar2, reiniciar2, detener2, flowSatisfaccion, flowverificacion };
