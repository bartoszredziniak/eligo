import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Input,
  signal,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  PLATFORM_ID,
  computed
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'eligo-scrollable-container',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="relative group w-full h-full px-4 flex items-center">
      <!-- Left Control (Button only) -->
      @if (canScrollLeft()) {
        <div class="absolute left-0 z-10 h-full flex items-center pr-2 pl-1">
          <p-button
            icon="pi pi-chevron-left"
            [rounded]="true"
            [text]="true"
            size="small"
            severity="secondary"
            styleClass="!shadow-none !w-8 !h-8 !bg-surface-0/50 backdrop-blur-sm"
            (onClick)="scrollLeft()"
          />
        </div>
      }

      <!-- Content Area with Mask -->
      <div
        #scrollContainer
        class="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar flex items-center gap-2 px-1 h-full"
        (scroll)="onScroll()"
        [style.mask-image]="maskImage()"
        [style.-webkit-mask-image]="maskImage()"
      >
        <ng-content></ng-content>
      </div>

      <!-- Right Control (Button only) -->
      @if (canScrollRight()) {
        <div class="absolute right-0 z-10 h-full flex items-center justify-end pl-2 pr-1">
          <p-button
            icon="pi pi-chevron-right"
            [rounded]="true"
            [text]="true"
            size="small"
            severity="secondary"
            styleClass="!shadow-none !w-8 !h-8 !bg-surface-0/50 backdrop-blur-sm"
            (onClick)="scrollRight()"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollableContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  @Input() step = 200;

  protected readonly canScrollLeft = signal(false);
  protected readonly canScrollRight = signal(false);

  // Compute mask image based on scroll state
  protected readonly maskImage = computed(() => {
    const left = this.canScrollLeft();
    const right = this.canScrollRight();
    const fade = '80px';

    if (left && right) {
      return `linear-gradient(to right, transparent, black ${fade}, black calc(100% - ${fade}), transparent)`;
    } else if (left) {
      return `linear-gradient(to right, transparent, black ${fade}, black)`;
    } else if (right) {
      return `linear-gradient(to right, black, black calc(100% - ${fade}), transparent)`;
    } else {
      return 'none';
    }
  });

  private resizeObserver!: ResizeObserver;
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.checkScroll();

    // Initialize ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.checkScroll();
      });
    });

    this.resizeObserver.observe(this.scrollContainer.nativeElement);

    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  protected onScroll() {
    this.checkScroll();
  }

  protected scrollLeft() {
    const el = this.scrollContainer.nativeElement;
    el.scrollLeft -= this.step;
  }

  protected scrollRight() {
    const el = this.scrollContainer.nativeElement;
    el.scrollLeft += this.step;
  }

  private onWindowResize = () => {
    this.checkScroll();
  }

  private checkScroll() {
    if (!this.scrollContainer) return;

    const el = this.scrollContainer.nativeElement;
    // const isScrollable = el.scrollWidth > el.clientWidth;

    // Use a small tolerance for float comparison
    const tolerance = 1;

    this.canScrollLeft.set(el.scrollLeft > tolerance);
    this.canScrollRight.set(el.scrollLeft < el.scrollWidth - el.clientWidth - tolerance);
  }
}
