import { inject, Pipe } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({ name: 'safeHtml', standalone: true })

export class SafeHtmlPipe {
private sanitizer = inject(DomSanitizer)
    transform(html: any) {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}