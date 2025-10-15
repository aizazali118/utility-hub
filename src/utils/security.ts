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

    // Disable right-click context menu
    this.disableContextMenu();

    // Disable keyboard shortcuts for developer tools
    this.disableKeyboardShortcuts();

    // Disable text selection
    this.disableTextSelection();

    // Detect and handle developer tools
    this.detectDevTools();
  }

  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, false);
  }

  private disableKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Disable F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Mac shortcuts
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }

      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        return false;
      }

      if (e.metaKey && e.altKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }
    }, false);
  }

  private disableTextSelection(): void {
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    }, false);

    document.addEventListener('copy', (e) => {
      e.preventDefault();
      return false;
    }, false);
  }

  private detectDevTools(): void {
    const element = new Image();
    let devtoolsOpen = false;

    Object.defineProperty(element, 'id', {
      get: () => {
        devtoolsOpen = true;
        this.handleDevToolsDetected();
      }
    });

    setInterval(() => {
      devtoolsOpen = false;
      console.log(element);
      console.clear();

      // Check window size for devtools detection
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        this.handleDevToolsDetected();
      }
    }, 1000);
  }

  private handleDevToolsDetected(): void {
    document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"><div style="text-align: center; padding: 2rem;"><h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Access Denied</h1><p style="font-size: 1.2rem; opacity: 0.9;">Developer tools are not allowed on this page.</p><p style="margin-top: 1rem; opacity: 0.7;">Please close developer tools to continue.</p></div></div>';
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