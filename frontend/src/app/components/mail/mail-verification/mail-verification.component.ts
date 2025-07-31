import { Component, inject } from '@angular/core';
import { MailService } from '../../../services/mail.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mail-verification',
  imports: [CommonModule],
  templateUrl: './mail-verification.component.html',
  styleUrl: './mail-verification.component.css'
})
export class MailVerificationComponent {
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
    this.verificarMail(contactoid!,id!);
  }
   verificarMail(contactoid: string, id: string) {
      this.res$ = this.mailService.verificarCorreo(contactoid,id);
      this.resSub = this.res$.subscribe({
        next: (r:any) => {
          this.res=r;
        },
      });
      this.status='success';
      error: (error:any) => {
        this.status='fail';
      }
}
}
