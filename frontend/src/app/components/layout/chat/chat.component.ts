import { Component, HostListener, inject } from '@angular/core';
import { Mensaje } from '../../../models/mensaje';
import { HttpClient } from '@angular/common/http';
import { buscarMensajePorId } from '../../../utils/chat.util';
import { SafeHtmlPipe } from '../../../utils/sanitizer.component';
import {CdkDrag} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-chat',
  imports: [SafeHtmlPipe, CdkDrag],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  mensajesEnviados: Mensaje[] = [];
  mensajes: Mensaje[] = [];
  _http = inject(HttpClient);
  deshabilitarBotones: boolean = false;

  constructor() {}
  ngOnInit(): void {
    this.cargarMensajes();
    this.cerrarElemento('chat');
    this.cerrarElemento('bubble-opener');
    this.cerrarElemento('gota2');
  }

  cerrarElemento(elemento : string) {
    if (typeof document !== 'undefined') {
      document.getElementById(elemento)!.style.display = 'none';
    }
  }

  abrirElemento(elemento : string) {
    if (typeof document !== 'undefined') {
      document.getElementById(elemento)!.style.display = 'block';
    }
  }

  

  cargarMensajes(): void {
    this._http.get<Mensaje[]>('json/chat.json').subscribe({
      next: (data) => {
        this.mensajes = data;
        this.enviarMensaje(1);
      },
      error: (err) => {
      },
    });
  }

  enviarMensaje(id: Number) {
    const mensaje = buscarMensajePorId(id, this.mensajes);
    if (mensaje) {
      this.mensajesEnviados.push(mensaje);
      this.scrollToBottom();
      if (mensaje.RespuestaId!=null) {
        this.deshabilitarBotones = true;
        if (!mensaje.EsBot){
        setTimeout(() => {
          this.enviarMensaje(mensaje.RespuestaId);
          this.deshabilitarBotones = false;
        }, 2000);
      }
    else{
      this.enviarMensaje(mensaje.RespuestaId);
      this.deshabilitarBotones = false;
    }
    }
    }
  }

  scrollToBottom() {
    if (typeof document !== 'undefined') {
      const chatDialog = document.getElementById('chat-dialog');
      if (chatDialog != null) {
        setTimeout(() => {
          chatDialog.scrollTop = chatDialog.scrollHeight;
          chatDialog.scrollTo({
          top: chatDialog.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
      }
    }
  }
}
