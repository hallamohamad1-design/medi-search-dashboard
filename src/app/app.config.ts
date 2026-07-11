import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';

// Chart.js — register all components globally so ng2-charts can use them
import {
  Chart,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BubbleController,
  RadarController,
  LineController,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BubbleController,
  RadarController,
  LineController,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding(),
    ),
    provideHttpClient(withFetch()),
    provideClientHydration(),
  ],
};
