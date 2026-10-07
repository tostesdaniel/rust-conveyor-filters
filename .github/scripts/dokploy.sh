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

deploy() {
  local app_id=$1
  api_post application.deploy "$(jq -n --arg id "$app_id" '{applicationId: $id}')" >/dev/null
}

# Creates the preview app on first run, then re-syncs env from the dev app and redeploys.
preview_up() {
  local environment_id=$1 template_app_id=$2 name=$3 image=$4 host=$5
  local app_id
  app_id=$(find_app "$environment_id" "$name")

  if [[ -z $app_id ]]; then
    api_post application.create "$(jq -n --arg env "$environment_id" --arg name "$name" \
      '{name: $name, appName: ("rcf-" + $name), environmentId: $env, description: "PR preview"}')" >/dev/null
    app_id=$(find_app "$environment_id" "$name")

    api_post application.saveDockerProvider "$(jq -n --arg id "$app_id" --arg image "$image" \
      '{applicationId: $id, dockerImage: $image, registryUrl: "ghcr.io", username: null, password: null}')" >/dev/null
    api_post application.update "$(jq -n --arg id "$app_id" \
      '{applicationId: $id, memoryLimit: "536870912"}')" >/dev/null
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
