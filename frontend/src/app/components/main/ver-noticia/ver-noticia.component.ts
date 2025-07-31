import { Component, inject } from '@angular/core';
import { Noticia } from '../../../models/noticia';
import { Observable, Subscription } from 'rxjs';
import { NoticiasService } from '../../../services/noticias.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SDT_Noticia } from '../../../models/sdt_noticias';
import { SafeHtmlPipe } from '../../../utils/sanitizer.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ver-noticia',
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './ver-noticia.component.html',
  styleUrl: './ver-noticia.component.css',
})
export class VerNoticiaComponent {
  noticias!: Noticia[];
  noticiasDestacadas!: Noticia[];
  noticiaRecuperada!: Noticia;
  img_URL: String = environment.URL_DOMAIN; //'http://192.168.192.31:9999/';

  private noticias$!: Observable<SDT_Noticia>;
  private noticiasD$!: Observable<Noticia[]>;
  private noticia$!: Observable<any>;
  private noticiaSub!: Subscription;
  private noticiaService = inject(NoticiasService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private noticia!: Noticia;

  ngOnInit() {
    this.obtenerNoticia(
      Number(this.activatedRoute.snapshot.paramMap.get('id'))
    );

    this.obtenerNoticiasPag(1);
    this.obtenerNoticiasDestacadas();
  }

  /**
   * Recupera las noticias mas recientes.
   * 
   * @param pag : Número de paginación para las noticias
   */
  
  obtenerNoticiasPag(pag: number) {
    this.noticias$ = this.noticiaService.getNoticiasPag(pag);
    this.noticiaSub = this.noticias$.subscribe({
      next: (data) => {
        this.noticias = new Array<Noticia>();
        (data.SDT_Noticias as any).forEach((el: Noticia) => {
          this.noticia = new Noticia();
          Object.assign(this.noticia, el);
          this.noticias.push(this.noticia);
        });
        this.noticias = this.noticias.slice(0, 3);
      },
    });
    
  }

  /**
   * Recupera las 5 noticias destacadas y las muestra en la parte derecha de la
   * pantalla en la seccion de ver noticia.
   */
  obtenerNoticiasDestacadas() {
    this.noticiasD$ = this.noticiaService.getNoticiasDestacadas();
    this.noticiaSub = this.noticiasD$.subscribe({
      next: (noticias) => {
        this.noticiasDestacadas = new Array<Noticia>();
        noticias.forEach((el) => {
          this.noticia = new Noticia();
          Object.assign(this.noticia, el);
          this.noticiasDestacadas.push(this.noticia);
        });
        if (this.noticiasDestacadas.length < 5)
          this.noticiasDestacadas = this.noticiasDestacadas.slice(0, 5);
      },
    });
  }


  /**
   * Obtiene la noticia con el ID proporcionado y la asigna a `noticiaRecuperada`.
   * @param id - El ID de la noticia a mostrar.
   */
  obtenerNoticia(id: number) {
    this.noticia$ = this.noticiaService.getNoticiaById(id);
    this.noticiaSub = this.noticia$.subscribe({
      next: (noticia) => {
        this.noticiaRecuperada = new Noticia();
        Object.assign(this.noticiaRecuperada, noticia);
      },
    });


/**
 * Se navega hasta 'ver-noticia' con el ID proporcionado, 
 * scrollea hasta arriba y se obtiene la noticia.
 * @param id - El ID de la noticia a mostrarse.
 */
  }
  ver_noticia(id: number) {
    this.router.navigate(['ver-noticia', id]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.obtenerNoticia(id);
  }
}
