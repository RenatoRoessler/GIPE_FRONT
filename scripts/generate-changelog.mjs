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
    stdio: ["ignore", "pipe", "ignore"],
  });
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

function isShallow() {
  return git(["rev-parse", "--is-shallow-repository"]).trim() === "true";
}

function readHistory() {
  if (isShallow()) {
    try {
      git(["fetch", "--unshallow", "--quiet"]);
    } catch {
      // Sem remote, rede ou permissão: segue com o histórico raso e marca como incompleto.
    }
  }
  const complete = !isShallow();
  const { total, entries } = parseGitLog(git(["log", GIT_LOG_FORMAT]));
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
    } catch {
      // Sem git ou sem .git: mantém o que já foi gerado.
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
