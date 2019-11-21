import * as k8s from "@pulumi/kubernetes";
import {Secret} from "@pulumi/kubernetes/core/v1";
import {
    CERT_MANAGER_NAMESPACE, CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL, CLOUDFLARE_SECRET_DATA_KEY,
    CLOUDFLARE_SECRET_NAME, LETSENCRYPT_EMAIL,
    PRODUCTION_CLUSTER_ISSUER_NAME,
    STAGING_CLUSTER_ISSUER_NAME
} from "../constants";
import {Chui} from "@chuistack/chui-lib";


/**
 * Check if cloudflare is enabled.
 */
const _cloudFlareEnabled = () =>
    Chui.Config.loadCurrentConfig().dnsSolver === Chui.Types.Config.DNSSolverProviders.CloudFlare;


/**
 * Sets up a secret with a CloudFlare Global API Key.
 * Note: API Tokens aren't compatible with cert-manager. Only the Global API Key can be used.
 */
const _configureCloudflareSecret = () => {
    return new k8s.core.v1.Secret(
        CLOUDFLARE_SECRET_NAME,
        {
            "metadata": {
                "name": CLOUDFLARE_SECRET_NAME,
                "namespace": CERT_MANAGER_NAMESPACE,
            },
            "stringData": {
                [CLOUDFLARE_SECRET_DATA_KEY]: CLOUDFLARE_API_KEY,
            }
        }
    );
};


/**
 * If a DNS solver is enabled, configure its secret.
 */
const configureDNSSolverSecret = () => {
    if (_cloudFlareEnabled()) {
        return _configureCloudflareSecret();
    }
    return;
};


/**
 * If the CloudFlare solver is enabled, add it to the configuration.
 *
 * @param solvers
 * @private
 */
const _enableCloudflareSolver = (solvers: any[]) => {
    if (_cloudFlareEnabled()) {
        solvers.push({
            "dns01": {
                "ingress": {
                    "class": "nginx"
                },
                "selector": {
                    "matchLabels": {
                        "use-cloudflare-solver": true,
                    }
                },
                "cloudflare": {
                    "email": CLOUDFLARE_EMAIL,
                    "apiKeySecretRef": {
                        "name": CLOUDFLARE_SECRET_NAME,
                        "key": CLOUDFLARE_SECRET_DATA_KEY,
                    }
                }
            },
        });
    }
};


/**
 * Enables the HTTP solver for cert-manager. Enabled by default.
 *
 * @param solvers
 * @private
 */
const _enableHttpSolver = (solvers: any[]) => {
    solvers.push({
        "http01": {
            "ingress": {
                "class": "nginx"
            },
        }
    });
};


/**
 * Enable a DNS solver if configured.
 *
 * @param solvers
 * @private
 */
const _enableSolvers = (solvers: any[]) => {
    _enableHttpSolver(solvers);
    _enableCloudflareSolver(solvers);
};


/**
 * Configure the production cluster issuer.
 * Use the staging one to test that certs are being properly issued first, due to restrictions
 * on the production apis from Let's Encrypt.
 */
const configureProductionClusterIssuer = (secret?: Secret) => {
    const solvers: any[] = [];
    _enableSolvers(solvers);

    const dependencies = secret ? [secret] : [];

    return new k8s.apiextensions.CustomResource(
        PRODUCTION_CLUSTER_ISSUER_NAME,
        {
            "apiVersion": "certmanager.k8s.io/v1alpha1",
            "kind": "ClusterIssuer",
            "metadata": {
                "name": PRODUCTION_CLUSTER_ISSUER_NAME,
            },
            "spec": {
                "acme": {
                    "email": LETSENCRYPT_EMAIL,
                    "server": "https://acme-v02.api.letsencrypt.org/directory",
                    "privateKeySecretRef": {
                        "name": "production-issuer-account-key"
                    },
                    "solvers": solvers,
                }
            }
        },
        {
            "dependsOn": dependencies,
        }
    );
};


/**
 * Configure the staging cluster issuer.
 * Use this to test that certs are being properly issued.
 */
const configureStagingClusterIssuer = (secret?: Secret) => {
    const solvers: any[] = [];
    _enableSolvers(solvers);

    const dependencies = secret ? [secret] : [];

    return new k8s.apiextensions.CustomResource(
        STAGING_CLUSTER_ISSUER_NAME,
        {
            "apiVersion": "certmanager.k8s.io/v1alpha1",
            "kind": "ClusterIssuer",
            "metadata": {
                "name": STAGING_CLUSTER_ISSUER_NAME,
            },
            "spec": {
                "acme": {
                    "email": LETSENCRYPT_EMAIL,
                    "server": "https://acme-staging-v02.api.letsencrypt.org/directory",
                    "privateKeySecretRef": {
                        "name": "staging-issuer-account-key"
                    },
                    "solvers": solvers,
                }
            }
        },
        {
            "dependsOn": dependencies,
        }
    );
};


/**
 * Installs the cluster issuers for the system.
 * In this case, we're configured to use the DNS validation through http (.well-known).
 */
export const install = () => {
    const issuerSecret = configureDNSSolverSecret();
    const productionClusterIssuer = configureProductionClusterIssuer(issuerSecret);
    const stagingClusterIssuer = configureStagingClusterIssuer(issuerSecret);

    return {
        productionClusterIssuer,
        stagingClusterIssuer,
    };
};