import { Routes } from '@angular/router';
import { HomeComponent } from './components/main/home/home.component';
import { NoticiasComponent } from './components/main/noticias/noticias.component';
import { VerNoticiaComponent } from './components/main/ver-noticia/ver-noticia.component';
import { PreguntasFrecuentesComponent } from './components/main/preguntas-frecuentes/preguntas-frecuentes.component';
import { TramitesComponent } from './components/main/tramites/tramites.component';
import { MailVerificationComponent } from './components/mail/mail-verification/mail-verification.component';
import { MailUnsuscribeComponent } from './components/mail/mail-unsuscribe/mail-unsuscribe.component';
import { ContactoComponent } from './components/main/contacto/contacto.component';



export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'noticias', component: NoticiasComponent},
    { path: 'ver-noticia/:id', component: VerNoticiaComponent},
    { path: 'preguntas-frecuentes', component: PreguntasFrecuentesComponent},
    { path: 'tramites', component: TramitesComponent},
    { path: 'verificar-mail/:contactoid/:id', component: MailVerificationComponent},
    { path: 'desuscribir-mail/:contactoid/:id', component: MailUnsuscribeComponent},
    {path : 'contacto', component: ContactoComponent}
];
