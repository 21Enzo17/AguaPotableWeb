import { Component } from '@angular/core';
import { NoticiasService } from '../../../services/noticias.service';
import { Noticia } from '../../../models/noticia';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { Observable, Subject, Subscribable, Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { SDT_Noticia } from '../../../models/sdt_noticias';
import { environment } from '../../../../environments/environment';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-noticias',
  imports: [CommonModule, ReactiveFormsModule, ],
  templateUrl: './noticias.component.html',
  styleUrl: './noticias.component.css',
})
export class NoticiasComponent {
  filtrarNoticiasForm = new FormGroup({
    filtro: new FormControl(''),
  });
  paginaActual: number = 1;
  esFiltro: boolean = false;
  cantidadPaginas: number = 1;
  noticias!: Noticia[];
  placeholder: Array<number>=[1,2,3,4,5];
  img_URL: String = environment.URL_DOMAIN; //'http://192.168.192.31:9999/';
  private noticias$!: Observable<SDT_Noticia>;
  private noticiaSub!: Subscription;
  private noticiaService = inject(NoticiasService);
  private router = inject(Router);
  private noticia!: Noticia;
 status: 'pending' | 'success' | 'fail' | 'error' = 'pending';

  get filtro() {
    return this.filtrarNoticiasForm.get('filtro');
  }
  ngOnInit() {
    this.obtenerNoticiasPag(1);
  }

    /**
   * Recupera las noticias mas recientes.
   * 
   * @param pag : Número de paginación para las noticias
   */
  obtenerNoticiasPag(pag: number) {
    this.paginaActual = pag;
    this.calcularCantidadPaginas(null);
    this.noticias$ = this.noticiaService.getNoticiasPag(pag);
    this.noticiaSub = this.noticias$.subscribe({
      next: (data) => {
        this.noticias = new Array<Noticia>();
        (data.SDT_Noticias as any).forEach((el: Noticia) => {
          this.noticia = new Noticia();
          Object.assign(this.noticia, el);
          this.noticias.push(this.noticia);
         
        });
        this.status="success";
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        this.status="fail";
      }
    });
  }

  /**
   * Recupera las noticias filtradas por título.
   * 
   * @param pag : Número de paginación para las noticias
   */
  obtenerNoticiasFiltradas(pag: number) {
    this.status="pending";
    if (this.filtro?.value) {
      this.paginaActual = pag;
      this.esFiltro = true;
      this.calcularCantidadPaginas(this.filtro!.value);
      this.noticias$ = this.noticiaService.recuperarNoticiasFiltradas(
        this.filtro!.value!,
        pag
      );
      this.noticiaSub = this.noticias$.subscribe({
        next: (data) => {
          this.noticias = new Array<Noticia>();
          (data.SDT_Noticias as any).forEach((el: Noticia) => {
            this.noticia = new Noticia();
            Object.assign(this.noticia, el);
            this.noticias.push(this.noticia);
            
          });
          this.status="success";
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error) => {
          this.status="fail";
        }
      });
    }
    else{
      this.obtenerNoticiasPag(1);
    }
  }

  /**
   * Quita el filtro actual y vuelve a mostrar todas las noticias.
   * 
   * Limpia el formulario de filtrado y resetea la paginación a 1.
   * Llama a obtenerNoticiasPag para recargar las noticias.
   */
  quitarFiltro() {
    this.esFiltro = false;
    this.filtro!.reset();
    this.paginaActual = 1;
    this.status="pending";
    this.obtenerNoticiasPag(this.paginaActual);
  }

  /**
 * Se navega hasta 'ver-noticia' con el ID proporcionado, 
 * scrollea hasta arriba y se obtiene la noticia.
 * @param id - El ID de la noticia a mostrarse.
 */
  ver_noticia(id: Number) {
    window.scrollTo({ top: 0 });
    this.router.navigate(['ver-noticia', id]);
  }

  /**
   * Incrementa la paginación actual en 1 y llama a verificarFiltro
   * para recargar las noticias. Si la paginación actual es igual a
   * la cantidad total de paginas, no hace nada.
   */
  aumentarPaginacion() {
    if (this.paginaActual == this.cantidadPaginas) return;
    this.paginaActual += 1;
    this.verificarFiltro(this.paginaActual);
  }

 /**
   * Decrementa la paginación actual en 1 y llama a verificarFiltro
   * para recargar las noticias. Si la paginación actual es igual a
   * 1, no hace nada.
   */
  restarPaginacion() {
     if (this.paginaActual == 1) return;
    this.paginaActual -= 1;
    this.verificarFiltro(this.paginaActual);
  }

  verificarFiltro(pag: number) {
    this.status="pending";
    if (this.esFiltro) this.obtenerNoticiasFiltradas(pag);
    else this.obtenerNoticiasPag(pag);
  }

  calcularCantidadPaginas(tituloFiltro: String | null) {
    this.noticiaService
      .getContadorNoticias(this.esFiltro, tituloFiltro)
      .subscribe({
        next: (res: any) => {
          this.cantidadPaginas = res.Contador;
          this.cantidadPaginas = Math.ceil(this.cantidadPaginas / 5);
         
        },
        error: (err: String) => console.log(err),
      });
  }
}
