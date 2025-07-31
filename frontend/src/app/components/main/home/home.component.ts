import { AfterViewInit, Component, inject } from '@angular/core';
import { Noticia } from '../../../models/noticia';
import { Observable, Subscription } from 'rxjs';
import { NoticiasService } from '../../../services/noticias.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatComponent } from "../../layout/chat/chat.component";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ChatComponent, RouterLink, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent{
  noticias!: Noticia[];
  img_URL: String = environment.URL_DOMAIN; //'http://192.168.192.31:9999/';
  status : 'loading' | 'success' | 'error'= 'loading';
  private noticias$!: Observable<Noticia[]>;
  private noticiaSub!: Subscription;
  private noticiaService = inject(NoticiasService);
  private router = inject(Router);
  private noticia!: Noticia;

  ngOnInit(){
    this.obtenerNoticias();
  }
  obtenerNoticias() {
      this.noticias$ = this.noticiaService.getNoticiasDestacadas();
      this.noticiaSub = this.noticias$.subscribe({
        next: (noticias) => {
          this.noticias = new Array<Noticia>();
          noticias.forEach((el) => {
            this.noticia = new Noticia();
            Object.assign(this.noticia, el);
            this.noticias.push(this.noticia);
            this.status = 'success';
          });
          this.noticias = this.noticias.slice(0, 4);
        },
        error: (error) => {
          this.status = 'error';
        }
      });
    }

    ver_noticia(id : Number){
      this.router.navigate(['ver-noticia',id])
      window.scrollTo({ top: 0 });
    }

    irPreguntasFrecuentes(){
      this.router.navigate(['preguntas-frecuentes'])
      window.scrollTo({ top: 0 });
    }


}
