import { addKeyword, EVENTS } from "@builderbot/bot";
import cron from "node-cron";

let cronJob;
const temporizadores = {};

const flujoInactividad = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { endFlow, flowDynamic }) => {
    console.log("El usuario se ha quedado inactivo.");

    const cronJob = cron.schedule("*/15 * * * *", async () => {
      console.log(
        "El usuario está inactivo. Enviando recordatorio de facturas..."
      );

      const mensaje =
        `🌟 *¡Hola! Soy tu asistente virtual Aguito 😃* 🌟\n\n` +
        `💳 *¡Paga tus facturas fácilmente!* 💳\n\n` +
        `💸 Puedes realizar tus pagos de manera segura con *transferencia bancaria.*\n\n` +
        `📑 Además, puedes *ver todas tus facturas adeudadas* y asegurarte de mantener tus pagos al día. 🧾\n\n` +
        `⚡ ¡No lo dejes para mañana! ⚡\n\n` +
        `👉 Si tienes alguna duda o necesitas ayuda, ¡estoy aquí para asistirte! 🙋‍♂️🙋‍♀️`;

      await flowDynamic(mensaje, {
        capture: true,
        buttons: [{ body: "Menu" }],
      });

      try {
        console.log("Intentando enviar el mensaje...");

        console.log("Mensaje enviado");
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
      }

      cronJob.stop();
      console.log("Cron job detenido");
    });

    cronJob.start();
    console.log("Cron job iniciado");

    return endFlow("El tiempo de respuesta ha expirado");
  }
);

const iniciar = (ctx, gotoFlow, ms) => {
  detener(ctx);

  temporizadores[ctx.from] = setTimeout(() => {
    console.log(`Tiempo de espera del usuario: ${ctx.from}`);
    return gotoFlow(flujoInactividad);
  }, ms);
};

const reiniciar = (ctx, gotoFlow, ms) => {
  console.log(`Reiniciando temporizador para el usuario: ${ctx.from}`);

  detener(ctx);

  if (temporizadores[ctx.from]) {
    clearTimeout(temporizadores[ctx.from]);
  }

  iniciar(ctx, gotoFlow, ms);
};

const detener = (ctx) => {
  if (temporizadores[ctx.from]) {
    clearTimeout(temporizadores[ctx.from]);
  }

  if (cronJob) {
    cronJob.stop();
    console.log("Cron job detenido");
  }
};

export { iniciar, reiniciar, detener, flujoInactividad };
