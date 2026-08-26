import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.get('/api/status/healthz', (req, res) => {
    res.status(200).json({ message: 'Router api is healthy',
        status: 'ok' });
});

app.get('/api/status/readyz', (req, res) => {
    res.status(200).json({ message: 'Router api is ready',
        status: 'ok' });
});



const proxies = {}
const AgentProxies = {}

function getProxy(sandboxId) {
    const target = `http://sandbox-service-${sandboxId}`;


    if (!proxies[sandboxId]) {
        proxies[sandboxId] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        });
    }
    return proxies[sandboxId];
}

function getAgentProxy(sandboxId) {
    const target = `http://sandbox-service-${sandboxId}:3000`;


    if (!AgentProxies[sandboxId]) {
        AgentProxies[sandboxId] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        });
    }
    return AgentProxies[sandboxId];
}

app.use((req, res, next) => {
  const host = req.headers.host || '';
  const parts = host.split('.');
  const sandboxId = parts[0];
  const subdomainType = parts[1];

  if (subdomainType === 'agent') {
      return getAgentProxy(sandboxId)(req, res, next);
  } else if (subdomainType === 'preview') {
      return getProxy(sandboxId)(req, res, next);
  }

  return getProxy(sandboxId)(req, res, next);
});

export default app;