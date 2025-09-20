// Security utilities for protecting the application

export class SecurityManager {
  private static instance: SecurityManager;
  private protectionEnabled = true;

  private constructor() {
    this.initializeProtection();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private initializeProtection(): void {
    if (!this.protectionEnabled) return;

    // Disable console in production
    if (process.env.NODE_ENV === 'production') {
      this.disableConsole();
    }

    // Add additional protection layers
    this.addDebuggerProtection();
    this.addSourceProtection();
  }

  private disableConsole(): void {
    const noop = () => {};
    const consoleKeys = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'dirxml', 'table', 'clear'];
    
    consoleKeys.forEach(key => {
      (console as any)[key] = noop;
    });
  }

  private addDebuggerProtection(): void {
    // Anti-debugging
    setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        // Debugger detected
        this.handleSecurityViolation();
      }
    }, 1000);
  }

  private addSourceProtection(): void {
    // Obfuscate critical functions
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args);
    };
  }

  private handleSecurityViolation(): void {
    // Redirect or show warning
    window.location.href = 'about:blank';
  }

  public encryptApiKey(key: string): string {
    // Simple encryption for API key storage
    return btoa(key.split('').reverse().join(''));
  }

  public decryptApiKey(encryptedKey: string): string {
    try {
      return atob(encryptedKey).split('').reverse().join('');
    } catch {
      return '';
    }
  }
}

// Initialize security manager
export const security = SecurityManager.getInstance();