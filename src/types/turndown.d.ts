declare module 'turndown' {
  class TurndownService {
    constructor(options?: any);
    turndown(html: string): string;
    addRule(key: string, rule: any): void;
  }

  export = TurndownService;
}