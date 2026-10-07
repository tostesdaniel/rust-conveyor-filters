/** "production", "dev" or "preview". */
export const deployEnv = process.env.DEPLOY_ENV || "local";

export const isProductionDeploy = deployEnv === "production";
