// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "divya-sadhana-admin-frontend",
      script: "npm",
      args: "start",
      env: {
        PORT: 3001
      }
    }
  ]
};