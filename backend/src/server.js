import { createServer } from 'node:http';
import { crearApp } from './app.js';
import { crearSocketServer } from './socket.js';
import { config } from './config.js';

const app = crearApp();
const httpServer = createServer(app);
crearSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`REA API + pizarra/salas en tiempo real escuchando en http://localhost:${config.port}`);
});