export * from './database';
export * from './carbon';

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface NotificationPreferences {
  dailyReminder: boolean;
  dailyReminderTime: string;
  weeklyReport: boolean;
  challengeUpdates: boolean;
  achievementAlerts: boolean;
  tipsAndInsights: boolean;
}

export interface OnboardingData {
  transport_mode: string;
  diet_type: string;
  energy_source: string;
  shopping_frequency: string;
  country_code: string;
  monthly_goal: number;
}
