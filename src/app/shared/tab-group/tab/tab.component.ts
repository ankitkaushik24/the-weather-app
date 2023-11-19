import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  inject,
} from "@angular/core";

@Component({
  selector: "app-tab",
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styleUrls: ["./tab.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent {
  @Input() label: string;

  private hostEl = inject(ElementRef).nativeElement as HTMLElement;

  private _isActive = false;
  @Input() set isActive(value: boolean) {
    this._isActive = value;
    this.hostEl.classList.toggle("active", !!value);
  }
  get isActive(): boolean {
    return this._isActive;
  }

  @Output() removed = new EventEmitter();
}
