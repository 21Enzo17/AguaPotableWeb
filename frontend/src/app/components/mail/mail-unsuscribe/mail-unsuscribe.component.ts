import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MailService } from '../../../services/mail.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mail-unsuscribe',
  imports: [CommonModule],
  templateUrl: './mail-unsuscribe.component.html',
  styleUrl: './mail-unsuscribe.component.css'
})
export class MailUnsuscribeComponent {
  private res$: any;
  private resSub: any;
  res: any;
  private mailService = inject(MailService);
  private route = inject(ActivatedRoute)
  status: 'pending' | 'success' | 'fail' | 'error' = 'pending';

  constructor() { }

  ngOnInit(){
    const contactoid = this.route.snapshot.paramMap.get('contactoid');
    const id = this.route.snapshot.paramMap.get('id');
    this.status='pending';
    this.bajaMail(contactoid!,id!);
  }
   bajaMail(contactoid: string, id: string) {
      this.res$ = this.mailService.bajaCorreo(contactoid,id);
      this.resSub = this.res$.subscribe({
        next: (r:any) => {
          this.res=r;
          console.log(this.res);
        },
      });
      this.status='success';
      error: (error:any) => {
        this.status='fail';
      }
}
}
