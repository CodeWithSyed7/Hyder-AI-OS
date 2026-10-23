# Desktop Commander — Native Windows Local Execution Bridge

Local service that executes authorized computer commands on behalf of the Haider executive agent.

## Quick Start on Windows

1. Double-click `run.bat` or run:
   ```cmd
   npm install
   npm start
   ```
2. The server binds to `http://127.0.0.1:9742`.
3. Open your Haider OS interface in the browser. It will immediately show:
   `COMMANDER: ONLINE`

## Endpoints
- `GET /health`: Connectivity and capabilities health check.
- `POST /handshake`: Authentication verification.
- `POST /api/execute`: Run classified PowerShell commands.
- `POST /api/screenshot`: Capture native Windows desktop image.
- `POST /api/action`: Synthetic mouse click, keyboard typing, or app launching.
- `GET /api/system`: Real-time CPU, RAM, open listening ports, and active processes.
- `POST /api/emergency-stop`: Immediately terminate active tasks and lock execution.
- `POST /api/reset-emergency`: Release emergency lock.
