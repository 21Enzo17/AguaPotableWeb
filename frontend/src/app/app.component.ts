import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/layout/nav/nav.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { HomeComponent } from './components/main/home/home.component';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title=inject(Title)
  meta=inject(Meta)


  ngOnInit(){
  this.title.setTitle('Agua Potable de Jujuy S.E.');
  this.meta.updateTag({ name: 'description', content: 'Sitio oficial de Agua Potable Jujuy. Consultas, facturación, reclamos y más.' });
  }
}
