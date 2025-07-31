import { Mensaje } from "../models/mensaje";


export function buscarMensajePorId(id: Number, mensajes: Mensaje[]): Mensaje | undefined  {
  const mensaje = mensajes.find((p: Mensaje) => p.Id === id);
  return mensaje;
}

