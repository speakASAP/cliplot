#!/usr/bin/env bash
# Publish this repository into docs-RAG by triggering an ingestion run.
#
# Credential: an auth-issued RS256 service JWT for the cliplot -> docs-rag pair,
# read from Vault (secret/prod/cliplot, property DOCS_RAG_SERVICE_TOKEN). It
# carries internal:docs-rag-microservice:ingest, the write tier -- retrieval
# callers get :readonly instead and are denied here.
#
# This used to read JWT_TOKEN out of the docs-rag pod's own environment, i.e. it
# borrowed the receiving service's credential rather than presenting its own.
# That variable is not set, so the script had been failing for every caller, and
# the service identity standard forbids the shape regardless: a CLI job is a
# caller and needs its own (caller -> target) principal.
set -euo pipefail

NAMESPACE="${NAMESPACE:-statex-apps}"
APP_LABEL="${DOCS_RAG_APP_LABEL:-app=docs-rag-microservice}"
PREFLIGHT_ONLY="${DOCS_RAG_PREFLIGHT_ONLY:-0}"
REPO_NAME="cliplot"

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

VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
VAULT_PATH="${DOCS_RAG_VAULT_PATH:-secret/prod/cliplot}"
VAULT_KEY="${DOCS_RAG_VAULT_KEY:-DOCS_RAG_SERVICE_TOKEN}"

# -field= is deliberately avoided: it appends a newline to the value.
DOCS_RAG_TOKEN="$(VAULT_ADDR="$VAULT_ADDR" vault kv get -format=json "$VAULT_PATH" 2>/dev/null \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write((JSON.parse(d).data.data[process.argv[1]]||"").trim())}catch(e){}})' "$VAULT_KEY")"
if [ -z "$DOCS_RAG_TOKEN" ]; then
  echo "DOCS_RAG_PUBLICATION=blocked" >&2
  echo "reason=${VAULT_KEY}_missing_at_${VAULT_PATH}" >&2
  echo "Mint it with auth-microservice/scripts/provision-service-token.js" >&2
  exit 2
fi
export DOCS_RAG_TOKEN

POD="$(kubectl get pod -n "$NAMESPACE" -l "$APP_LABEL" --field-selector=status.phase=Running -o json | node -e '
let input = "";
process.stdin.on("data", (chunk) => input += chunk);
process.stdin.on("end", () => {
  const pods = JSON.parse(input).items || [];
  const candidates = pods
    .filter((pod) => !pod.metadata?.deletionTimestamp)
    .filter((pod) => (pod.status?.conditions || []).some((condition) => condition.type === "Ready" && condition.status === "True"))
    .sort((a, b) => String(a.metadata?.creationTimestamp || "").localeCompare(String(b.metadata?.creationTimestamp || "")));
  const selected = candidates[candidates.length - 1];
  if (selected) process.stdout.write(selected.metadata.name);
});
')"
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
  kubectl exec -n "$NAMESPACE" "$POD" --env="DOCS_RAG_TOKEN=$DOCS_RAG_TOKEN" -- node -e '
const token = process.env.DOCS_RAG_TOKEN;
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
  console.log("reason=DOCS_RAG_TOKEN_not_propagated");
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

kubectl exec -n "$NAMESPACE" "$POD" --env="DOCS_RAG_TOKEN=$DOCS_RAG_TOKEN" -- node -e '
const repoName = process.argv[1];
const token = process.env.DOCS_RAG_TOKEN;
const base = "http://127.0.0.1:3397";
if (!token) {
  console.log("DOCS_RAG_PUBLICATION=blocked");
  console.log("reason=DOCS_RAG_TOKEN_not_propagated");
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
