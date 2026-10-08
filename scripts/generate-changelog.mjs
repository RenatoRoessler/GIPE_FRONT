// Gera src/generated/{version,changelog}.json a partir do histórico do git.
// Os arquivos são versionados: quem roda este script é a skill `commit`, depois de criar os commits.
// Uso: npm run generate:changelog [-- --next]
//
// --next: soma 1 à versão para contar o commit "chore(changelog)" que a skill criará logo em seguida,
//         de modo que a versão gravada seja igual ao total de commits depois desse commit.
//         Se o HEAD já for esse commit, nada é somado (a execução fica idempotente).
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
const CHANGELOG_COMMIT_SUBJECT = /^chore\(changelog\):/;
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

function cleanDescription(body) {
  return body
    .split(/\r?\n/)
    .filter((line) => !FOOTER_LINE.test(line.trim()))
    .join("\n")
    .trim();
}

// Função pura: recebe a saída de `git log` no formato GIT_LOG_FORMAT (mais recente primeiro).
// A versão de cada entrada é a posição do commit no histórico: o mais antigo é 1.0.1.
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

// Grava só quando o conteúdo mudou e de forma atômica. Retorna true se o arquivo foi alterado.
function writeIfChanged(file, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  if (existsSync(file) && readFileSync(file, "utf8") === content) return false;
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, file);
  return true;
}

export function generateChangelog({ next = false } = {}) {
  // Com histórico raso a contagem seria errada: recusa em vez de gravar um número incorreto.
  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
    throw new Error("repositório raso: rode `git fetch --unshallow` antes de gerar a versão");
  }

  const { total, entries } = parseGitLog(git(["log", GIT_LOG_FORMAT]));
  if (total === 0) throw new Error("nenhum commit encontrado");

  const headIsChangelogCommit = CHANGELOG_COMMIT_SUBJECT.test(git(["log", "-1", "--format=%s"]).trim());
  const version = total + (next && !headIsChangelogCommit ? 1 : 0);

  mkdirSync(OUT_DIR, { recursive: true });
  const versionChanged = writeIfChanged(VERSION_FILE, {
    complete: true,
    version: `${VERSION_PREFIX}${version}`,
    total: version,
    highlight: entries[0]?.version ?? null,
  });
  const changelogChanged = writeIfChanged(CHANGELOG_FILE, { complete: true, entries });

  return { version: `${VERSION_PREFIX}${version}`, changed: versionChanged || changelogChanged };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { version, changed } = generateChangelog({ next: process.argv.includes("--next") });
    console.log(`[changelog] versão ${version} ${changed ? "atualizada" : "já estava atualizada"}`);
  } catch (error) {
    console.error(`[changelog] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
