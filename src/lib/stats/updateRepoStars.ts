import { kv } from "@vercel/kv";
import { Octokit } from "octokit";

import { siteConfig } from "@/config/site";

const GITHUB_REPO_OWNER = siteConfig.links.repo.split("/")[3];
const GITHUB_REPO_NAME = siteConfig.links.repo.split("/")[4];

export async function updateRepoStars() {
  try {
    const noCacheFetch = (url: string, options: RequestInit) => {
      return fetch(url, {
        ...options,
        cache: "no-store",
      });
    };
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    const { data } = await octokit.rest.repos.get({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      request: { fetch: noCacheFetch },
    });

    await kv.set("repo-stars", data.stargazers_count);
    return data.stargazers_count;
  } catch (error) {
    console.error("Error updating repo stars:", error);
    throw error;
  }
}
