#!/usr/bin/env bash
set -euo pipefail

: "${DOKPLOY_URL:?}" "${DOKPLOY_TOKEN:?}"

api_get() {
  curl --fail-with-body -sS "$DOKPLOY_URL/api/$1" -H "x-api-key: $DOKPLOY_TOKEN"
}

api_post() {
  curl --fail-with-body -sS -X POST "$DOKPLOY_URL/api/$1" \
    -H "x-api-key: $DOKPLOY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2"
}

find_app() {
  local environment_id=$1 name=$2
  api_get "environment.one?environmentId=$environment_id" |
    jq -r --arg name "$name" '.applications[] | select(.name == $name) | .applicationId'
}

deployment_ids() {
  api_get "application.one?applicationId=$1" | jq -c '[.deployments[].deploymentId]'
}

# Dokploy only queues the deployment, so poll until the new one finishes.
deploy() {
  local app_id=$1
  local before
  before=$(deployment_ids "$app_id")
  api_post application.deploy "$(jq -n --arg id "$app_id" --arg title "${DEPLOY_TITLE:-GitHub Actions}" \
    '{applicationId: $id, title: $title}')" >/dev/null

  local deadline=$((SECONDS + 600)) status=""
  while ((SECONDS < deadline)); do
    sleep 5
    status=$(api_get "application.one?applicationId=$app_id" | jq -r --argjson before "$before" '
      [.deployments[] | select(.deploymentId | IN($before[]) | not)]
      | sort_by(.createdAt) | last | .status // "queued"')
    case $status in
      done) echo "Deployment finished"; return 0 ;;
      error | cancelled) echo "::error::Dokploy deployment $status"; return 1 ;;
    esac
  done
  echo "::error::Dokploy deployment still $status after 10 minutes"
  return 1
}

# Every step is safe to repeat, so a run that failed halfway is fixed by the next one.
preview_up() {
  local environment_id=$1 template_app_id=$2 name=$3 image=$4 host=$5
  local app_id
  app_id=$(find_app "$environment_id" "$name")

  if [[ -z $app_id ]]; then
    api_post application.create "$(jq -n --arg env "$environment_id" --arg name "$name" \
      '{name: $name, appName: ("rcf-" + $name), environmentId: $env, description: "PR preview"}')" >/dev/null
    app_id=$(find_app "$environment_id" "$name")
  fi

  api_post application.saveDockerProvider "$(jq -n --arg id "$app_id" --arg image "$image" \
    '{applicationId: $id, dockerImage: $image, registryUrl: "ghcr.io", username: null, password: null}')" >/dev/null
  api_post application.update "$(jq -n --arg id "$app_id" \
    '{applicationId: $id, memoryLimit: "536870912"}')" >/dev/null

  local has_domain
  has_domain=$(api_get "application.one?applicationId=$app_id" | jq --arg host "$host" 'any(.domains[]; .host == $host)')
  if [[ $has_domain != true ]]; then
    api_post domain.create "$(jq -n --arg id "$app_id" --arg host "$host" \
      '{applicationId: $id, host: $host, path: "/", port: 3000, https: true, certificateType: "none", domainType: "application"}')" >/dev/null
  fi

  local env
  env=$(api_get "application.one?applicationId=$template_app_id" | jq -r '.env // ""')
  api_post application.saveEnvironment "$(jq -n --arg id "$app_id" --arg env "$env" \
    '{applicationId: $id, env: $env, buildArgs: null, buildSecrets: null, createEnvFile: false}')" >/dev/null

  deploy "$app_id"
}

preview_down() {
  local environment_id=$1 name=$2
  local app_id
  app_id=$(find_app "$environment_id" "$name")
  if [[ -n $app_id ]]; then
    api_post application.delete "$(jq -n --arg id "$app_id" '{applicationId: $id}')" >/dev/null
  fi
}

"$@"
