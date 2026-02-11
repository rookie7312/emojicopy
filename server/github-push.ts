import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE = new Set([
  '.git', 'node_modules', '.cache', '.config', '.upm', '.local',
  'attached_assets', 'static-site', 'emojicopy-project.zip',
  'emojicopy-project.tar.gz', 'emojicopy-static.zip',
  'generate-static.cjs', '.replit'
]);

function collectFiles(dir: string, base: string = ''): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    if (IGNORE.has(entry)) continue;
    const fullPath = path.join(dir, entry);
    const relPath = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectFiles(fullPath, relPath));
    } else if (stat.isFile()) {
      try {
        const content = fs.readFileSync(fullPath);
        results.push({
          path: relPath,
          content: content.toString('base64')
        });
      } catch {
        // skip unreadable files
      }
    }
  }
  return results;
}

async function main() {
  const repoName = 'emojicopy';

  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();

  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  let repoExists = false;
  try {
    await octokit.repos.get({ owner: user.login, repo: repoName });
    repoExists = true;
    console.log(`Repository ${user.login}/${repoName} already exists.`);
  } catch {
    console.log(`Creating repository ${repoName}...`);
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'EmojiCopy - A fast emoji copy and paste website with 400+ emojis',
      private: false,
      auto_init: true,
    });
    console.log('Repository created!');
  }

  // wait a moment for repo init
  await new Promise(r => setTimeout(r, 2000));

  console.log('Collecting project files...');
  const projectDir = path.resolve(import.meta.dirname, '..');
  const files = collectFiles(projectDir);
  console.log(`Found ${files.length} files to push.`);

  // Get the default branch ref
  let baseSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
    });
    baseSha = ref.object.sha;
  } catch {
    // Try 'master' as fallback
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/master',
    });
    baseSha = ref.object.sha;
  }

  console.log('Creating file blobs...');
  const treeItems: any[] = [];

  for (const file of files) {
    const { data: blob } = await octokit.git.createBlob({
      owner: user.login,
      repo: repoName,
      content: file.content,
      encoding: 'base64',
    });
    treeItems.push({
      path: file.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.sha,
    });

    if (treeItems.length % 20 === 0) {
      console.log(`  Uploaded ${treeItems.length}/${files.length} files...`);
    }
  }

  console.log('Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    tree: treeItems,
    base_tree: baseSha,
  });

  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: 'EmojiCopy - Full project push from Replit',
    tree: tree.sha,
    parents: [baseSha],
  });

  console.log('Updating branch ref...');
  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
    });
  } catch {
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/master',
      sha: commit.sha,
    });
  }

  console.log(`\nDone! Your code is now on GitHub:`);
  console.log(`https://github.com/${user.login}/${repoName}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
