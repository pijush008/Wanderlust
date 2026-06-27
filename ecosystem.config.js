/**
 * ================= PM2 ECOSYSTEM CONFIG =================
 * 
 * PM2 is a production process manager for Node.js.
 * Provides: clustering, auto-restart, log management, monitoring.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js          — Start all apps
 *   pm2 start ecosystem.config.js --only web  — Start web only
 *   pm2 reload ecosystem.config.js         — Zero-downtime reload
 *   pm2 scale web +2                       — Add 2 more workers
 *   pm2 monit                              — Real-time monitoring
 *   pm2 logs                               — View logs
 * 
 * Architecture:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  PM2 Daemon                                          │
 *   │    ├── web (cluster mode × 4 instances)             │
 *   │    │     ├── Worker 0 → Express + Socket.IO         │
 *   │    │     ├── Worker 1 → Express + Socket.IO         │
 *   │    │     ├── Worker 2 → Express + Socket.IO         │
 *   │    │     └── Worker 3 → Express + Socket.IO         │
 *   │    └── worker (fork mode × 1 instance)              │
 *   │          └── Background job processor               │
 *   └─────────────────────────────────────────────────────┘
 */

module.exports = {
  apps: [
    // ================= WEB SERVER =================
    {
      name: "web",
      script: "app.js",
      instances: "max",           // One per CPU core (or set number: 4)
      exec_mode: "cluster",       // Cluster mode for load balancing
      
      // Environment
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Auto-restart
      watch: false,               // Don't watch in production
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      max_restarts: 10,           // Max restarts before stopping
      min_uptime: "10s",          // Min uptime to consider "started"

      // Graceful shutdown
      kill_timeout: 10000,        // 10s to finish requests before kill
      listen_timeout: 5000,       // 5s to bind port
      shutdown_with_message: true,

      // Logging
      log_file: "./logs/combined.log",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Zero-downtime reload
      wait_ready: true,           // Wait for process.send('ready')
      
      // Health check
      health_check_grace_period: 3000,
    },

    // ================= BACKGROUND WORKER =================
    {
      name: "worker",
      script: "worker.js",
      instances: 1,               // Single worker instance
      exec_mode: "fork",          // Fork mode (not cluster)

      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },

      // Auto-restart
      watch: false,
      max_memory_restart: "300M",
      max_restarts: 5,

      // Logging
      log_file: "./logs/worker-combined.log",
      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
