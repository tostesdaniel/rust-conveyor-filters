FROM oven/bun:1.3.12-slim AS bun

# trixie: bookworm's postgresql-client is 15, too old to talk to a 16 server.
FROM node:24.15.0-trixie-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        git \
        less \
        openssh-client \
        postgresql-client \
        procps \
    && rm -rf /var/lib/apt/lists/*

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN ln -sf /usr/local/bin/bun /usr/local/bin/bunx

ENV NEXT_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1 \
    BUN_INSTALL_CACHE_DIR=/home/node/.bun/install/cache \
    SHELL=/bin/bash \
    NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PATH=/home/node/.npm-global/bin:$PATH

# Must exist and be node-owned before compose mounts the volumes over them.
RUN mkdir -p /home/node/.bun/install/cache \
        /home/node/.npm-global \
        /home/node/.claude \
        /workspaces/rust-conveyor-filters/node_modules \
        /workspaces/rust-conveyor-filters/.next \
    && chown -R node:node /home/node /workspaces \
    # Login shells rebuild PATH from /etc/profile, so ENV alone isn't enough.
    && printf 'export PATH=/home/node/.npm-global/bin:$PATH\n' \
        > /etc/profile.d/10-npm-global.sh

USER node

ARG INSTALL_CLAUDE_CODE=true
RUN if [ "$INSTALL_CLAUDE_CODE" = "true" ]; then \
        npm install -g --no-fund --no-audit @anthropic-ai/claude-code \
        && npm cache clean --force; \
    fi
