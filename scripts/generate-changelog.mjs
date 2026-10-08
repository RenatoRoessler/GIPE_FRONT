// Gera src/generated/{version,changelog}.json a partir do histórico do git, em tempo de build.
// Nunca lança exceção: qualquer falha resulta em manter os arquivos existentes ou no estado "incompleto".
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "src", "generated");
const VERSION_FILE = path.join(OUT_DIR, "version.json");
const CHANGELOG_FILE = path.join(OUT_DIR, "changelog.json");

const GIT_LOG_FORMAT = "--format=%H%x1f%aI%x1f%s%x1f%b%x1e";
const CONVENTIONAL_SUBJECT = /^(feat|fix)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const FOOTER_LINE = /^(co-authored-by|signed-off-by):/i;
const VERSION_PREFIX = "1.0.";

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// Registra no log de build o motivo de o histórico ficar incompleto, sem vazar credenciais de URLs.
const URL_CREDENTIALS = /\/\/[^@/\s]+@/g;

function warn(message, error) {
  // Só stderr/código: a mensagem do erro do Node repete a linha de comando, que pode conter o token.
  const reason = error ? String(error.stderr || "").trim() || `código ${error.status ?? error.code ?? "desconhecido"}` : "";
  const detail = reason ? ` (${reason.replace(URL_CREDENTIALS, "//***@")})` : "";
  console.warn(`[changelog] ${message}${detail}`);
}

function cleanDescription(body) {
  return body
    .split(/\r?\n/)
    .filter((line) => !FOOTER_LINE.test(line.trim()))
    .join("\n")
    .trim();
}

// Função pura: recebe a saída de `git log` no formato GIT_LOG_FORMAT (mais recente primeiro).
export function parseGitLog(raw) {
  const records = raw
    .split("\x1e")
    .map((record) => record.replace(/^\r?\n/, ""))
    .filter((record) => record.trim() !== "");
  const total = records.length;
  const entries = [];

  records.forEach((record, index) => {
    const [, date = "", subject = "", body = ""] = record.split("\x1f");
    const match = CONVENTIONAL_SUBJECT.exec(subject.trim());
    if (!match) return;
    entries.push({
      version: `${VERSION_PREFIX}${total - index}`,
      type: match[1],
      scope: match[2] ?? null,
      title: match[4].trim(),
      description: cleanDescription(body),
      date: date.trim(),
    });
  });

  return { total, entries };
}

// Repositório privado: o clone raso do provedor de deploy costuma não guardar credencial.
// GIT_FETCH_TOKEN (token somente leitura do GitHub) permite buscar o histórico completo.
function authArgs() {
  const token = process.env.GIT_FETCH_TOKEN;
  if (!token) return [];
  const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
  return ["-c", `http.extraheader=AUTHORIZATION: basic ${basic}`];
}

function isShallow() {
  return git(["rev-parse", "--is-shallow-repository"]).trim() === "true";
}

function readHistory() {
  if (isShallow()) {
    try {
      git([...authArgs(), "fetch", "--unshallow", "--quiet"]);
    } catch (error) {
      // Sem remote, rede ou permissão: segue com o histórico raso e marca como incompleto.
      warn("não foi possível completar o histórico com git fetch --unshallow", error);
    }
  }
  const complete = !isShallow();
  const { total, entries } = parseGitLog(git(["log", GIT_LOG_FORMAT]));
  if (!complete) warn(`histórico raso: apenas ${total} commits disponíveis, versão marcada como indisponível`);
  return { complete: complete && total > 0, total, entries };
}

function buildFiles({ complete, total, entries }) {
  return {
    version: {
      complete,
      version: complete ? `${VERSION_PREFIX}${total}` : null,
      total,
      highlight: complete ? (entries[0]?.version ?? null) : null,
    },
    changelog: { complete, entries },
  };
}

// Grava só quando o conteúdo mudou (evita recompilações em `next dev`) e de forma atômica.
function writeIfChanged(file, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  if (existsSync(file) && readFileSync(file, "utf8") === content) return;
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, file);
}

export function generateChangelog() {
  try {
    mkdirSync(OUT_DIR, { recursive: true });
    let files;
    try {
      files = buildFiles(readHistory());
    } catch (error) {
      // Sem git ou sem .git: mantém o que já foi gerado.
      warn("não foi possível ler o histórico do git", error);
      if (existsSync(VERSION_FILE) && existsSync(CHANGELOG_FILE)) return;
      files = buildFiles({ complete: false, total: 0, entries: [] });
    }
    writeIfChanged(VERSION_FILE, files.version);
    writeIfChanged(CHANGELOG_FILE, files.changelog);
  } catch {
    // Nunca impede dev/build.
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateChangelog();
}
