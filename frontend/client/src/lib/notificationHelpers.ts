// Notification Helper Functions
// Import this in any component to trigger notifications

import { useNotifications } from '@/contexts/NotificationContext';

export function useNotificationTriggers() {
  const { addNotification } = useNotifications();

  return {
    // Booking Notifications
    notifyNewBooking: (customerName: string, service: string, date: string, bookingId: string) => {
      addNotification({
        type: 'booking',
        title: 'New Booking Created',
        message: `${customerName} booked ${service} for ${date}`,
        priority: 'high',
        actionUrl: '/dashboard/appointments',
        actionLabel: 'View Booking',
        metadata: { bookingId },
      });
    },

    notifyBookingCancelled: (customerName: string, service: string) => {
      addNotification({
        type: 'booking',
        title: 'Booking Cancelled',
        message: `${customerName} cancelled ${service}`,
        priority: 'medium',
        actionUrl: '/dashboard/appointments',
        actionLabel: 'View Details',
      });
    },

    notifyBookingRescheduled: (customerName: string, oldDate: string, newDate: string) => {
      addNotification({
        type: 'booking',
        title: 'Booking Rescheduled',
        message: `${customerName} moved appointment from ${oldDate} to ${newDate}`,
        priority: 'medium',
        actionUrl: '/dashboard/appointments',
        actionLabel: 'View Calendar',
      });
    },

    // Payment Notifications
    notifyPaymentReceived: (customerName: string, amount: number) => {
      addNotification({
        type: 'payment',
        title: 'Payment Received',
        message: `₹${amount} received from ${customerName}`,
        priority: 'high',
        actionUrl: '/dashboard/invoices',
        actionLabel: 'View Invoice',
        metadata: { amount },
      });
    },

    notifyPaymentPending: (customerName: string, amount: number) => {
      addNotification({
        type: 'payment',
        title: 'Payment Pending',
        message: `₹${amount} pending from ${customerName}`,
        priority: 'medium',
        actionUrl: '/dashboard/invoices',
        actionLabel: 'Send Reminder',
        metadata: { amount },
      });
    },

    notifyPaymentFailed: (customerName: string, amount: number) => {
      addNotification({
        type: 'payment',
        title: 'Payment Failed',
        message: `₹${amount} payment failed for ${customerName}`,
        priority: 'high',
        actionUrl: '/dashboard/invoices',
        actionLabel: 'Retry Payment',
        metadata: { amount },
      });
    },

    // Customer Notifications
    notifyNewCustomer: (customerName: string, customerId: string) => {
      addNotification({
        type: 'customer',
        title: 'New Customer Registered',
        message: `${customerName} just joined!`,
        priority: 'low',
        actionUrl: '/dashboard/customers',
        actionLabel: 'View Profile',
        metadata: { customerId },
      });
    },

    notifyCustomerBirthday: (customerName: string) => {
      addNotification({
        type: 'customer',
        title: '🎂 Customer Birthday Today',
        message: `It's ${customerName}'s birthday! Send wishes.`,
        priority: 'medium',
        actionUrl: '/dashboard/customers',
        actionLabel: 'Send Wishes',
      });
    },

    notifyReturningCustomer: (customerName: string, lastVisit: string) => {
      addNotification({
        type: 'customer',
        title: 'Returning Customer',
        message: `${customerName} is back! Last visit: ${lastVisit}`,
        priority: 'low',
        actionUrl: '/dashboard/customers',
        actionLabel: 'View History',
      });
    },

    // Inventory Notifications
    notifyLowStock: (productName: string, quantity: number, productId: string) => {
      addNotification({
        type: 'inventory',
        title: 'Low Stock Alert',
        message: `${productName} is running low (${quantity} units left)`,
        priority: 'high',
        actionUrl: '/dashboard/products',
        actionLabel: 'Reorder Now',
        metadata: { productId },
      });
    },

    notifyOutOfStock: (productName: string) => {
      addNotification({
        type: 'inventory',
        title: 'Out of Stock',
        message: `${productName} is out of stock!`,
        priority: 'high',
        actionUrl: '/dashboard/products',
        actionLabel: 'Restock',
      });
    },

    notifyStockRestocked: (productName: string, quantity: number) => {
      addNotification({
        type: 'inventory',
        title: 'Stock Restocked',
        message: `${productName} restocked with ${quantity} units`,
        priority: 'low',
        actionUrl: '/dashboard/products',
        actionLabel: 'View Inventory',
      });
    },

    // Staff Notifications
    notifyStaffSchedule: (staffName: string, shift: string, date: string) => {
      addNotification({
        type: 'staff',
        title: 'Staff Schedule Update',
        message: `${staffName} scheduled for ${shift} on ${date}`,
        priority: 'low',
        actionUrl: '/dashboard/team-members',
        actionLabel: 'View Schedule',
      });
    },

    notifyStaffLeave: (staffName: string, dates: string) => {
      addNotification({
        type: 'staff',
        title: 'Staff Leave Request',
        message: `${staffName} requested leave for ${dates}`,
        priority: 'medium',
        actionUrl: '/dashboard/team-members',
        actionLabel: 'Approve/Reject',
      });
    },

    notifyStaffAbsent: (staffName: string, date: string) => {
      addNotification({
        type: 'staff',
        title: 'Staff Absent',
        message: `${staffName} is marked absent for ${date}`,
        priority: 'high',
        actionUrl: '/dashboard/team-attendance',
        actionLabel: 'View Attendance',
      });
    },

    // Workflow Notifications
    notifyWorkflowSuccess: (workflowName: string, workflowId: string) => {
      addNotification({
        type: 'workflow',
        title: 'Workflow Completed',
        message: `${workflowName} executed successfully`,
        priority: 'low',
        actionUrl: '/dashboard/workflows',
        actionLabel: 'View Logs',
        metadata: { workflowId },
      });
    },

    notifyWorkflowFailed: (workflowName: string, error: string) => {
      addNotification({
        type: 'workflow',
        title: 'Workflow Failed',
        message: `${workflowName} failed: ${error}`,
        priority: 'high',
        actionUrl: '/dashboard/workflows',
        actionLabel: 'Fix Issue',
      });
    },

    // System Notifications
    notifySystemUpdate: (message: string) => {
      addNotification({
        type: 'system',
        title: 'System Update',
        message,
        priority: 'medium',
        actionUrl: '/dashboard',
        actionLabel: 'Learn More',
      });
    },

    notifySystemMaintenance: (scheduledTime: string) => {
      addNotification({
        type: 'system',
        title: 'Scheduled Maintenance',
        message: `System maintenance scheduled for ${scheduledTime}`,
        priority: 'medium',
        actionUrl: '/dashboard',
        actionLabel: 'View Details',
      });
    },

    // Generic notification
    notify: (title: string, message: string, type: any = 'system', priority: any = 'medium') => {
      addNotification({
        type,
        title,
        message,
        priority,
      });
    },
  };
}

// Standalone notification helper functions (for use outside React components)
export function notifyPaymentReceived(notifications: any, data: { customerName: string; amount: number; invoiceId: string }) {
  notifications.addNotification({
    type: 'payment',
    title: 'Payment Received',
    message: `₹${data.amount.toFixed(2)} received from ${data.customerName}`,
    priority: 'high',
    actionUrl: '/dashboard/invoices',
    actionLabel: 'View Invoice',
    metadata: { invoiceId: data.invoiceId },
  });
}

export function notifyPaymentPending(notifications: any, data: { customerName: string; amount: number; invoiceId: string }) {
  notifications.addNotification({
    type: 'payment',
    title: 'Payment Pending',
    message: `₹${data.amount.toFixed(2)} pending from ${data.customerName}`,
    priority: 'medium',
    actionUrl: '/dashboard/invoices',
    actionLabel: 'Send Reminder',
    metadata: { invoiceId: data.invoiceId },
  });
}

export function notifyPaymentOverdue(notifications: any, data: { customerName: string; amount: number; invoiceId: string; daysOverdue: number }) {
  notifications.addNotification({
    type: 'payment',
    title: 'Payment Overdue',
    message: `₹${data.amount.toFixed(2)} overdue by ${data.daysOverdue} days from ${data.customerName}`,
    priority: 'high',
    actionUrl: '/dashboard/invoices',
    actionLabel: 'Follow Up',
    metadata: { invoiceId: data.invoiceId },
  });
}

// Demo function to trigger sample notifications (for testing)
export function triggerDemoNotifications(notificationTriggers: ReturnType<typeof useNotificationTriggers>) {
  const { 
    notifyNewBooking, 
    notifyPaymentReceived, 
    notifyLowStock,
    notifyCustomerBirthday,
    notifyStaffLeave,
    notifyWorkflowSuccess,
  } = notificationTriggers;

  // Trigger demo notifications with delay
  setTimeout(() => notifyNewBooking('John Doe', 'Premium Spa Package', 'Dec 5, 2024', 'book123'), 1000);
  setTimeout(() => notifyPaymentReceived('Sarah Smith', 2500), 3000);
  setTimeout(() => notifyLowStock('Aromatherapy Oil', 3, 'prod456'), 5000);
  setTimeout(() => notifyCustomerBirthday('Mike Johnson'), 7000);
  setTimeout(() => notifyStaffLeave('Emma Wilson', 'Dec 10-12'), 9000);
  setTimeout(() => notifyWorkflowSuccess('Welcome Email Campaign', 'wf789'), 11000);
}
