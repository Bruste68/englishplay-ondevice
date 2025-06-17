module.exports = {
  apps: [
    {
      name: 'samspeak-backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '300M', // 메모리 초과 시 재시작
      env: {
        NODE_ENV: 'production',
        PORT: 5000, // 필요시 다른 env도 추가
        NODE_PATH: "./node_modules"
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
