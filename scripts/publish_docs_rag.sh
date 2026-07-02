#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-statex-apps}"
APP_LABEL="${DOCS_RAG_APP_LABEL:-app=docs-rag-microservice}"
PREFLIGHT_ONLY="${DOCS_RAG_PREFLIGHT_ONLY:-0}"
REPO_NAME="cliplot-service"

for arg in "$@"; do
  case "$arg" in
    --preflight)
      PREFLIGHT_ONLY="1"
      ;;
    *)
      REPO_NAME="$arg"
      ;;
  esac
done

POD="$(kubectl get pod -n "$NAMESPACE" -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.name}')"
if [ -z "$POD" ]; then
  if [ "$PREFLIGHT_ONLY" = "1" ]; then
    echo "DOCS_RAG_PREFLIGHT=blocked"
  else
    echo "DOCS_RAG_PUBLICATION=blocked"
  fi
  echo "reason=docs_rag_pod_not_found"
  exit 2
fi

if [ "$PREFLIGHT_ONLY" = "1" ]; then
  kubectl exec -n "$NAMESPACE" "$POD" -- node -e '
const token = process.env.JWT_TOKEN;
const base = "http://127.0.0.1:3397";
const embeddingUrl = process.env.OLLAMA_URL || process.env.EMBEDDING_BASE_URL || process.env.EMBEDDINGS_URL || "";
let blocked = false;

function report(key, value) {
  console.log(`${key}=${String(value).replace(/\s+/g, "_")}`);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { parseError: "non_json_response" };
  }
  return { response, payload };
}

if (!token) {
  console.log("DOCS_RAG_PREFLIGHT=blocked");
  console.log("reason=JWT_TOKEN_missing_in_docs_rag_pod");
  process.exit(2);
}

try {
  const status = await requestJson(`${base}/ingestion/status`, {
    headers: { authorization: `Bearer ${token}` },
  });
  report("docsRagStatusHttp", status.response.status);
  if (!status.response.ok) {
    blocked = true;
    report("statusReason", "docs_rag_status_unreachable");
  }
} catch (error) {
  blocked = true;
  report("statusReason", "docs_rag_status_fetch_failed");
  report("statusError", error?.message || "unknown");
}

if (!embeddingUrl) {
  blocked = true;
  report("embeddingReason", "embedding_backend_url_missing");
} else {
  report("embeddingBackendConfigured", true);
  report("embeddingBackendUrl", embeddingUrl);
  try {
    const url = new URL("/api/tags", embeddingUrl);
    const embedding = await requestJson(url);
    report("embeddingHttp", embedding.response.status);
    if (!embedding.response.ok) {
      blocked = true;
      report("embeddingReason", "embedding_backend_unhealthy");
    }
  } catch (error) {
    blocked = true;
    report("embeddingReason", "embedding_backend_fetch_failed");
    report("embeddingError", error?.message || "unknown");
  }
}

if (blocked) {
  console.log("DOCS_RAG_PREFLIGHT=blocked");
  process.exit(2);
}
console.log("DOCS_RAG_PREFLIGHT=pass");
process.exit(0);
'
  exit $?
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
