import { CommonModule } from "@angular/common";
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  DestroyRef,
  Input,
  QueryList,
  inject,
} from "@angular/core";
import { TabComponent } from "./tab/tab.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { tap } from "rxjs/operators";

@Component({
  selector: "app-tab-group",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tab-group.component.html",
  styleUrls: ["./tab-group.component.css"],
})
export class TabGroupComponent implements AfterContentInit {
  @Input() removable = true;
  @ContentChildren(TabComponent) tabs: QueryList<TabComponent>;
  destroyRef = inject(DestroyRef);

  ngAfterContentInit(): void {
    const safelySelectTab = () => {
      if (this.tabs.first && !this.tabs.some((tab) => tab.isActive)) {
        this.selectTab(this.tabs.first);
      }
    };
    this.tabs.changes
      .pipe(tap(safelySelectTab), takeUntilDestroyed(this.destroyRef))
      .subscribe();

    safelySelectTab();
  }

  selectTab(tab: TabComponent): void {
    if (tab.isActive) {
      return;
    }
    // mark other tabs as inactive before marking the current tab as active
    this.tabs.forEach((tabInstance) => (tabInstance.isActive = false));

    tab.isActive = true;
  }

  removeTab(tab: TabComponent) {
    tab.removed.emit();
  }
}

export const TabsModule = [TabGroupComponent, TabComponent];
