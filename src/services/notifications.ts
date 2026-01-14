// Notification service for budget alerts

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
};

export const showBudgetWarning = (category: string, spent: number, limit: number): void => {
  const percent = Math.round((spent / limit) * 100);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (percent >= 100) {
    showNotification(`${category} Budget Exceeded!`, {
      body: `You've spent ${formatCurrency(spent)} - ${formatCurrency(spent - limit)} over your ${formatCurrency(limit)} limit.`,
      tag: `budget-exceeded-${category}`,
    });
  } else if (percent >= 90) {
    showNotification(`${category} Budget Warning`, {
      body: `You've used ${percent}% of your ${formatCurrency(limit)} budget. Only ${formatCurrency(limit - spent)} remaining.`,
      tag: `budget-warning-${category}`,
    });
  } else if (percent >= 80) {
    showNotification(`${category} Budget Alert`, {
      body: `Heads up! You've used ${percent}% of your ${category} budget.`,
      tag: `budget-alert-${category}`,
    });
  }
};

export const showOverallBudgetWarning = (spent: number, limit: number): void => {
  const percent = Math.round((spent / limit) * 100);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (percent >= 100) {
    showNotification('Monthly Budget Exceeded!', {
      body: `You've spent ${formatCurrency(spent)} - ${formatCurrency(spent - limit)} over your ${formatCurrency(limit)} monthly budget.`,
      tag: 'monthly-budget-exceeded',
    });
  } else if (percent >= 90) {
    showNotification('Monthly Budget Warning', {
      body: `You've used ${percent}% of your monthly budget. Only ${formatCurrency(limit - spent)} remaining.`,
      tag: 'monthly-budget-warning',
    });
  }
};

export const showBillReminder = (billName: string, amount: number, dueDate: string): void => {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  showNotification(`Bill Due Soon: ${billName}`, {
    body: `${formatCurrency(amount)} due on ${new Date(dueDate).toLocaleDateString()}`,
    tag: `bill-reminder-${billName}`,
  });
};
