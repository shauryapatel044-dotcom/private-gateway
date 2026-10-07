module.exports = {
  apps: [
    {
      name: 'upi-gateway',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL:
          'postgresql://postgres.pbalmdgeqarijsgjkykn:pZL75bYTyI0PIUey@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://pbalmdgeqarijsgjkykn.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDE3MjQsImV4cCI6MjEwNjkxNzcyNH0.ihAMjzHPdOPBc5P8JTqenYrNWw7BcDdkly5o_HzF7_Q',
        SUPABASE_ANON_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDE3MjQsImV4cCI6MjEwNjkxNzcyNH0.ihAMjzHPdOPBc5P8JTqenYrNWw7BcDdkly5o_HzF7_Q',
        SUPABASE_SERVICE_ROLE_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM0MTcyNCwiZXhwIjoyMTA2OTE3NzI0fQ.w5c4k4lmI3qsOaMWbQ2UGn0xgg4z-N7ES585puUlmy8',
        JWT_SECRET: 'super-secret-gateway-key-change-in-production-12345',
      },
    },
  ],
};
