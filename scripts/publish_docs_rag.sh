#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-statex-apps}"
APP_LABEL="${DOCS_RAG_APP_LABEL:-app=docs-rag-microservice}"
REPO_NAME="${1:-cliplot-service}"

POD="$(kubectl get pod -n "$NAMESPACE" -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.name}')"
if [ -z "$POD" ]; then
  echo "DOCS_RAG_PUBLICATION=blocked"
  echo "reason=docs_rag_pod_not_found"
  exit 2
fi

kubectl exec -n "$NAMESPACE" "$POD" -- node -e '
const repoName = process.argv[1];
const token = process.env.JWT_TOKEN;
const base = "http://127.0.0.1:3397";
if (!token) {
  console.log("DOCS_RAG_PUBLICATION=blocked");
  console.log("reason=JWT_TOKEN_missing_in_docs_rag_pod");
  process.exit(2);
}
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    console.log("DOCS_RAG_PUBLICATION=fail");
    console.log("status=" + response.status);
    console.log("body=" + JSON.stringify(payload));
    process.exit(1);
  }
  return payload;
}
const started = await request("/ingestion/trigger", {
  method: "POST",
  body: JSON.stringify({ repoName, repoUrl: "local", localPath: true, force: true }),
});
const jobId = started.jobId;
for (let i = 0; i < 24; i += 1) {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const status = await request("/ingestion/status");
  const job = status.jobs.find((item) => item.id === jobId);
  if (!job) continue;
  if (job.status === "completed") {
    console.log("DOCS_RAG_PUBLICATION=pass");
    console.log("repoName=" + repoName);
    console.log("jobId=" + jobId);
    console.log("chunksProcessed=" + job.chunksProcessed);
    console.log("chunksTotal=" + job.chunksTotal);
    process.exit(0);
  }
  if (job.status === "failed") {
    console.log("DOCS_RAG_PUBLICATION=fail");
    console.log("repoName=" + repoName);
    console.log("jobId=" + jobId);
    console.log("error=" + (job.errorMessage || "unknown"));
    process.exit(1);
  }
}
console.log("DOCS_RAG_PUBLICATION=blocked");
console.log("repoName=" + repoName);
console.log("jobId=" + jobId);
console.log("reason=ingestion_timeout");
process.exit(2);
' "$REPO_NAME"
