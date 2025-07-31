import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Noticia } from '../models/noticia';
import { environment } from '../../environments/environment';
import { SDT_Noticia } from '../models/sdt_noticias';

@Injectable({
  providedIn: 'root',
})
export class NoticiasService {
  private _http: HttpClient = inject(HttpClient);
  private base_URL = environment.API_URL; //'http://192.168.192.31:9999/ApiNoticias/';
  constructor() {}



  getNoticiasDestacadas(): Observable<Noticia[]> {
    return this._http.get<Noticia[]>(
      this.base_URL + 'RecuperarNoticiasDestacadas'
    );
  }
  getNoticiaById(id: number): Observable<Noticia> {
    const Options = {
      headers: { 'Content-Type': 'application/json' },
      params: { NoticiaId: id },
    };
    return this._http.get<Noticia>(this.base_URL + 'RecuperarNoticia', Options);
  }

  getNoticiasPag(pag: number): Observable<SDT_Noticia> {
    const Options = {
      headers: { 'Content-Type': 'application/json' },
      params: { NoticiaPag: pag },
    };
    return this._http.get<SDT_Noticia>(
      this.base_URL + 'RecuperarNoticiasPag',
      Options
    );
  }

  recuperarNoticiasFiltradas(
    filter: String,
    pag: number
  ): Observable<SDT_Noticia> {
    const Options = {
      headers: { 'Content-Type': 'application/json' },
    };
    return this._http.get<SDT_Noticia>(
      this.base_URL +
        `RecuperarNoticiasFiltradas?NoticiaPag=` +
        pag +
        `&Filter=` +
        filter,
      Options
    );
  }
  getContadorNoticias(
    isFiltro: boolean,
    filter: String | null
  ): Observable<number> {
    if (isFiltro) {
      const Options = {
        headers: { 'Content-Type': 'application/json' },
      };
      return this._http.get<number>(
        this.base_URL + 'RecuperarCantidadNoticiasF?Filter=' + filter
      );
    } else {
      return this._http.get<number>(
        this.base_URL + 'RecuperarCantidadNoticias'
      );
    }
  }

}
