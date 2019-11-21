import {Config} from "@pulumi/pulumi";

const config = new Config();

/***********************
 * CERT MANAGER        *
 ***********************/

export const CERT_MANAGER_NAMESPACE = "cert-manager";
export const CERT_MANAGER_RELEASE_NAME = "cert-manager";

export const PRODUCTION_CLUSTER_ISSUER_NAME = "letsencrypt-prod";
export const PRODUCTION_CLUSTER_ISSUER_ANNOTATION = {
    "certmanager.k8s.io/cluster-issuer": PRODUCTION_CLUSTER_ISSUER_NAME,
};

export const STAGING_CLUSTER_ISSUER_NAME = "letsencrypt-staging";
export const STAGING_CLUSTER_ISSUER_ANNOTATION = {
    "certmanager.k8s.io/cluster-issuer": STAGING_CLUSTER_ISSUER_NAME,
};

export const CLOUDFLARE_SECRET_NAME = "cloudflare-key";
export const CLOUDFLARE_SECRET_DATA_KEY = "api-key.txt";
export const CLOUDFLARE_EMAIL = config.requireSecret("cloudflareEmail");
export const CLOUDFLARE_API_KEY = config.requireSecret("cloudflareKey");
export const LETSENCRYPT_EMAIL = config.requireSecret("letsencryptEmail");
