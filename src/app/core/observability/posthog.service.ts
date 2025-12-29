// src/app/services/posthog.service.ts
import {DestroyRef, inject, Injectable, PLATFORM_ID} from "@angular/core";
import posthog, {DisplaySurveyType} from "posthog-js";
import {Router} from "@angular/router";
import {environment} from '../../../environments/environment';
import {isPlatformBrowser} from '@angular/common';

@Injectable({providedIn: "root"})
export class PosthogService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private platform_id = inject(PLATFORM_ID);

  constructor() {
    this.initPostHog();
  }

  private initPostHog() {
    if (isPlatformBrowser(this.platform_id)) {
      posthog.init(environment.posthogKey, {
        api_host: environment.posthogHost,
        defaults: '2025-11-30',
      });
    }
  }

  getSurvey(id: string) {
    if (isPlatformBrowser(this.platform_id)) {
      return new Promise<any>((resolve) => {
        posthog.getSurveys((surveys) => {
          const survey = surveys.find(s => s.id === id);
          resolve(survey);
        }, true); // forceReload
      });
    }
    return Promise.resolve(null);
  }

  captureSurveyResponse(surveyId: string, response: any) {
    if (isPlatformBrowser(this.platform_id)) {
      console.log({
        $survey_id: surveyId,
        $survey_response: response
      });
      posthog.capture('survey sent', {
        $survey_id: surveyId,
        $survey_response: response
      });
    }
  }
}
