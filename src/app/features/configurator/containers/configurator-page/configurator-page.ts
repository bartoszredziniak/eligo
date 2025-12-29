import { Component, ChangeDetectionStrategy, inject, ViewChild, Injector, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { UiLayout, MobileTab } from '../../../../shared/ui/ui-layout/ui-layout';
import { Header } from '../../../../core/layout/header/header';
import { ToolsSidebar } from '../../../../core/layout/tools-sidebar/tools-sidebar';
import { SummaryBar } from '../../../../core/layout/summary-bar/summary-bar';
import { CanvasStage } from '../../components/canvas-stage/canvas-stage';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';
import { HelpDialogComponent } from '../../components/help-dialog/help-dialog.component';
import { RestoreConfigDialogComponent } from '../../components/restore-config-dialog/restore-config-dialog.component';
import { MobileBottomNav } from '../../../../shared/ui/mobile-bottom-nav/mobile-bottom-nav';
import { MobileSummaryBar } from '../../../../core/layout/mobile-summary-bar/mobile-summary-bar';
import { Router } from '@angular/router';
import { PosthogService } from '../../../../core/observability/posthog.service';
import { SurveyDialogComponent, Survey } from '../../components/survey-dialog/survey-dialog.component';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'eligo-configurator-page',
  imports: [
    CommonModule,
    TooltipModule,
    UiLayout,
    Header,
    ToolsSidebar,
    SummaryBar,
    CanvasStage,
    HelpDialogComponent,
    RestoreConfigDialogComponent,
    MobileBottomNav,
    MobileSummaryBar,
    SurveyDialogComponent,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <eligo-ui-layout [activeTab]="activeMobileTab()">
      <!-- Header -->
      <eligo-header
        header
        [price]="drawerService.totalPrice()"
        (addBoxClicked)="canvasStage.addBox($event)"
        (helpClicked)="helpVisible.set(true)"
        (restoreClicked)="restoreVisible.set(true)"
        (startOverClicked)="onStartOver()"
        (surveyClicked)="onSurveyClicked()"
      />

      <!-- Left Sidebar -->
      <eligo-tools-sidebar sidebarLeft />

      <!-- Main Content (3D Canvas) -->
      <eligo-canvas-stage #canvasStage />

      <!-- Desktop Footer -->
      <eligo-summary-bar
        footer
        [price]="drawerService.totalPrice()"
        [weight]="drawerService.totalWeight()"
        [configCode]="drawerService.configCode()"
        (generateOrder)="onGenerateOrder()"
      />

      <!-- Mobile Footer (compact) -->
      <!-- REMOVED from slot, now just a dialog host -->

      <!-- Mobile Bottom Navigation -->
      <eligo-mobile-bottom-nav
        bottomNav
        [activeTab]="activeMobileTab()"
        (tabChange)="onMobileTabChange($event)"
        (menuClicked)="onStartOver()"
      />

      <!-- Mobile Summary View -->
      <eligo-mobile-summary-view
        summary
        [price]="drawerService.totalPrice()"
        [weight]="drawerService.totalWeight()"
        [configCode]="drawerService.configCode()"
        (generateOrder)="onGenerateOrder()"
      />
    </eligo-ui-layout>

    <eligo-help-dialog [(visible)]="helpVisible" />
    <eligo-restore-config-dialog [(visible)]="restoreVisible" />
    <eligo-survey-dialog 
      [(visible)]="surveyVisible" 
      [survey]="surveyData()"
      (surveySubmit)="onSurveySubmit($event)"
    />
    <p-toast position="bottom-center" />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguratorPage {
  @ViewChild('canvasStage') canvasStage!: CanvasStage;

  protected readonly drawerService = inject(DrawerService);
  protected readonly stateService = inject(ConfiguratorStateService);
  private readonly injector = inject(Injector);
  private readonly posthog = inject(PosthogService);
  private readonly messageService = inject(MessageService);

  protected readonly helpVisible = signal(false);
  protected readonly restoreVisible = signal(false);
  protected readonly surveyVisible = signal(false);
  protected readonly surveyData = signal<Survey | null>(null);

  // Mobile state
  protected readonly activeMobileTab = signal<MobileTab>('canvas');

  onMobileTabChange(tab: MobileTab) {
    this.activeMobileTab.set(tab);
  }

  private router = inject(Router);

  onStartOver() {
    this.drawerService.clearBoxes();
    this.router.navigate(['/']);
  }

  async onSurveyClicked() {
    const surveyId = '019b667f-d1a1-0000-7aab-4a63640cc211';
    const survey = await this.posthog.getSurvey(surveyId) as Survey | null;
    console.log(survey);
    if (survey) {
      this.surveyData.set(survey);
      this.surveyVisible.set(true);
    } else {
      console.warn('Survey not found or blocked');
    }
  }

  onSurveySubmit(event: { surveyId: string, responses: any[] }) {
    // For single-question surveys (common with API type), PostHog expects the value directly
    // rather than an array, to display it correctly as text.
    const response = event.responses[0];
    this.posthog.captureSurveyResponse(event.surveyId, response);
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Dziękujemy!', 
      detail: 'Twoja opinia została wysłana.',
      life: 3000
    });
  }

  async onGenerateOrder(): Promise<void> {
    if (!this.canvasStage) {
      console.error('Canvas stage not available');
      return;
    }

    const pdfGenerator = this.injector.get(PdfGeneratorService);
    const drawerImage = this.canvasStage.captureScene();

    await pdfGenerator.generateOrderPdf(
      this.drawerService.drawerConfig(),
      this.drawerService.boxes(),
      drawerImage,
      this.drawerService.generateConfigCode()
    );
  }
}
