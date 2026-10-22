import { k8sCoreV1Api } from "./config.js";
//ye service ki configuration hai jo sandbox ke liye create ki ja rahi hai. Ye service do ports ko expose karegi: ek 80 port jo "sandbox-container" ke 5173 port ko map karega aur ek 3000 port jo "agent-container" ke 3000 port ko map karega. Ye service ek ClusterIP type ki service hai jo internal communication ke liye use hoti hai.
export const createService = async (sandboxId) => {
    const serviceManifest = {
        metadata: {
            name: `sandbox-service-${sandboxId}`,
            labels: {
                sandboxId: sandboxId
            }
        },
        spec: {
            selector: {
                sandboxId: sandboxId
            },
            ports: [
                {
                    name: "http",
                    port: 80,
                    targetPort: 5173,
                    protocol: "TCP"
                },
                {
                    name: "agent-http",
                    port: 3000,
                    targetPort: 3000,
                    protocol: "TCP"
                }
            ],
            type: "ClusterIP"
        }
    }

    const response = await k8sCoreV1Api.createNamespacedService({
        namespace: 'default',
        body: serviceManifest
    })

    return response;
}

export async function deleteService(sandboxId) {
    const response = await k8sCoreV1Api.deleteNamespacedService({
        namespace: 'default',
        name: `sandbox-service-${sandboxId}`
    })

    return response;
}