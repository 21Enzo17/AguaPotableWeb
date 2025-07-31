import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MailService {
 private _http: HttpClient = inject(HttpClient);
 private puerto = '9999';
  private base_URL = 'http://192.168.192.31:'+this.puerto+'/ApiNoticias/';
  constructor() { }

  verificarCorreo(contactoid: string, id: string): Observable<any> {
      const Options = {
        headers: { 'Content-Type': 'application/json' },
        params: { ContactoId: contactoid,
          emailId: id },
      };
      return this._http.get<any>(this.base_URL + 'AltaCorreo', Options);
    }

    bajaCorreo(contactoid: string, id: string): Observable<any> {
      const Options = {
        headers: { 'Content-Type': 'application/json' },
        params: { ContactoId: contactoid,
          emailId: id },
      };
      return this._http.get<any>(this.base_URL + 'BajaCorreo', Options);
    }
}
