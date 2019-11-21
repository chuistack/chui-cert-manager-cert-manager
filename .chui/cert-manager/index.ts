import * as k8s from "@pulumi/kubernetes";
import * as clusterIssuers from "./cluster-issuers";
import {CERT_MANAGER_NAMESPACE, CERT_MANAGER_RELEASE_NAME} from "../constants";

/**
 * Install the cert manager:
 * https://docs.cert-manager.io/en/latest/getting-started/install/kubernetes.html
 */
export const install = () => {
    new k8s.yaml.ConfigFile("https://raw.githubusercontent.com/jetstack/cert-manager/release-0.10/deploy/manifests/00-crds.yaml");


    const certManagerNamespace = new k8s.core.v1.Namespace(CERT_MANAGER_NAMESPACE, {
        "metadata": {
            "name": CERT_MANAGER_NAMESPACE,
            "labels": {
                "certmanager.k8s.io/disable-validation": "true"
            }
        }
    });


    const certManager = new k8s.helm.v2.Chart(CERT_MANAGER_RELEASE_NAME, {
        "chart": "jetstack/cert-manager",
        "version": "v0.10.0",
        "namespace": CERT_MANAGER_NAMESPACE,
    }, {
        "dependsOn": [ certManagerNamespace ],
    });

    const clusterIssuersOutput = clusterIssuers.install();

    return {
        certManagerNamespace,
        certManager,
        ...clusterIssuersOutput,
    };
};