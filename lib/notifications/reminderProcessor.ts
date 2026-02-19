import { reminderService } from './reminderService';
import { supabase } from '@/lib/supabase/client';

/**
 * Background service to process due reminders
 * This should be called periodically (e.g., every minute) to check for due reminders
 */
class ReminderProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Start the reminder processor
   * @param intervalMs - Interval in milliseconds (default: 60000 = 1 minute)
   */
  start(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      console.log('Reminder processor is already running');
      return;
    }

    console.log(`Starting reminder processor with ${intervalMs}ms interval`);
    
    this.processingInterval = setInterval(async () => {
      await this.processDueReminders();
    }, intervalMs);

    // Process immediately on start
    this.processDueReminders();
  }

  /**
   * Stop the reminder processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Reminder processor stopped');
    }
  }

  /**
   * Process due reminders
   */
  async processDueReminders(): Promise<void> {
    if (this.isProcessing) {
      console.log('Reminder processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      console.log('Processing due reminders...');
      const result = await reminderService.processDueReminders();
      
      if (result.processed > 0 || result.errors > 0) {
        console.log(`Processed ${result.processed} reminders, ${result.errors} errors`);
        
        // Log the processing result
        await this.logProcessingResult(result);
      }
    } catch (error) {
      console.error('Error processing due reminders:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process due reminders manually (for testing or immediate processing)
   */
  async processDueRemindersNow(): Promise<{ processed: number; errors: number }> {
    if (this.isProcessing) {
      throw new Error('Reminder processing is already in progress');
    }

    this.isProcessing = true;

    try {
      const result = await reminderService.processDueReminders();
      await this.logProcessingResult(result);
      return result;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get processing status
   */
  getStatus(): { isRunning: boolean; isProcessing: boolean } {
    return {
      isRunning: this.processingInterval !== null,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Log processing result to database
   */
  private async logProcessingResult(result: { processed: number; errors: number }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          type: 'reminder_processing',
          content_type: 'system',
          content_id: 'reminder_processor',
          sent_count: result.processed,
          failed_count: result.errors,
          sent_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error logging reminder processing result:', error);
      }
    } catch (error) {
      console.error('Error logging reminder processing result:', error);
    }
  }

  /**
   * Get reminder processing statistics
   */
  async getProcessingStats(): Promise<{
    totalProcessed: number;
    totalErrors: number;
    lastProcessed: Date | null;
    averageProcessingTime: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('type', 'reminder_processing')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch processing stats: ${error.message}`);
      }

      const totalProcessed = data?.reduce((sum, log) => sum + log.sent_count, 0) || 0;
      const totalErrors = data?.reduce((sum, log) => sum + log.failed_count, 0) || 0;
      const lastProcessed = data?.[0]?.sent_at ? new Date(data[0].sent_at) : null;
      
      // Calculate average processing time (simplified)
      const averageProcessingTime = data?.length || 0;

      return {
        totalProcessed,
        totalErrors,
        lastProcessed,
        averageProcessingTime,
      };
    } catch (error) {
      console.error('Error fetching processing stats:', error);
      return {
        totalProcessed: 0,
        totalErrors: 0,
        lastProcessed: null,
        averageProcessingTime: 0,
      };
    }
  }

  /**
   * Clean up old processed reminders
   * This should be called periodically to clean up old, inactive reminders
   */
  async cleanupOldReminders(daysOld: number = 30): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('user_reminders')
        .delete()
        .eq('is_active', false)
        .lt('updated_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup old reminders: ${error.message}`);
      }

      const deleted = data?.length || 0;
      console.log(`Cleaned up ${deleted} old reminders`);

      return { deleted };
    } catch (error) {
      console.error('Error cleaning up old reminders:', error);
      return { deleted: 0 };
    }
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details: {
      isRunning: boolean;
      isProcessing: boolean;
      lastProcessed: Date | null;
      totalProcessed: number;
      totalErrors: number;
      errorRate: number;
    };
  }> {
    try {
      const status = this.getStatus();
      const stats = await this.getProcessingStats();
      
      const errorRate = stats.totalProcessed > 0 
        ? (stats.totalErrors / (stats.totalProcessed + stats.totalErrors)) * 100 
        : 0;

      let systemStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      let message = 'Reminder processor is running normally';

      if (!status.isRunning) {
        systemStatus = 'error';
        message = 'Reminder processor is not running';
      } else if (errorRate > 10) {
        systemStatus = 'warning';
        message = `High error rate: ${errorRate.toFixed(1)}%`;
      } else if (stats.lastProcessed && 
                 (Date.now() - stats.lastProcessed.getTime()) > 5 * 60 * 1000) {
        systemStatus = 'warning';
        message = 'Reminder processor has not processed recently';
      }

      return {
        status: systemStatus,
        message,
        details: {
          isRunning: status.isRunning,
          isProcessing: status.isProcessing,
          lastProcessed: stats.lastProcessed,
          totalProcessed: stats.totalProcessed,
          totalErrors: stats.totalErrors,
          errorRate,
        },
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      return {
        status: 'error',
        message: 'Failed to get health status',
        details: {
          isRunning: false,
          isProcessing: false,
          lastProcessed: null,
          totalProcessed: 0,
          totalErrors: 0,
          errorRate: 0,
        },
      };
    }
  }
}

// Export singleton instance
export const reminderProcessor = new ReminderProcessor();

// Export the class for testing
export { ReminderProcessor };
