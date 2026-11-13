import { server } from "./server";

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Dineeze API & Socket Server running on port ${PORT}`);
  console.log(`📡 Healthcheck available at http://localhost:${PORT}/health`);
});

