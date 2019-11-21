import * as certManager from "./cert-manager";
import {
    PRODUCTION_CLUSTER_ISSUER_ANNOTATION,
    STAGING_CLUSTER_ISSUER_ANNOTATION,
} from "./constants";

certManager.install();

export const productionClusterIssuerAnnotation = PRODUCTION_CLUSTER_ISSUER_ANNOTATION;
export const stagingClusterIssuerAnnotation = STAGING_CLUSTER_ISSUER_ANNOTATION;
