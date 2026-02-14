import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'package-lock.json',
  '.cache',
  'dist',
  '.config',
  '.local',
  '.upm',
  '.replit',
  '.nix',
  '.breakpoints',
  '.pythonlibs',
];

function shouldSkip(filePath: string): boolean {
  const parts = filePath.split('/');
  for (const pattern of SKIP_PATTERNS) {
    if (parts.includes(pattern) || filePath === pattern) return true;
  }
  return false;
}

function getAllFiles(dirPath: string, basePath: string = dirPath): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    if (shouldSkip(relativePath)) continue;

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, basePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function main() {
  const octokit = await getUncachableGitHubClient();

  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;
  const repo = 'LegalAI';

  console.log(`Authenticated as: ${owner}`);

  try {
    await octokit.repos.createForAuthenticatedUser({
      name: repo,
      description: 'AI-Powered Legal Document Review Application',
      auto_init: false,
      private: false,
    });
    console.log(`Created repository: ${repo}`);
  } catch (err: any) {
    if (err.status === 422) {
      console.log(`Repository "${repo}" already exists, proceeding...`);
    } else {
      throw err;
    }
  }

  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });
    parentSha = ref.object.sha;
    console.log(`Found existing main branch at: ${parentSha}`);
  } catch {
    console.log('Empty repo detected, initializing with README...');
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from('# LegalAI\nAI-Powered Legal Document Review Application\n').toString('base64'),
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });
    parentSha = ref.object.sha;
    console.log(`Initialized repo, main branch at: ${parentSha}`);
  }

  const projectRoot = path.resolve(import.meta.dirname, '..');
  const files = getAllFiles(projectRoot);
  console.log(`Found ${files.length} files to push`);

  const blobs: { path: string; sha: string; mode: string; type: string }[] = [];

  for (const filePath of files) {
    const fullPath = path.join(projectRoot, filePath);
    const content = fs.readFileSync(fullPath);
    const base64Content = content.toString('base64');

    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo,
      content: base64Content,
      encoding: 'base64',
    });

    blobs.push({
      path: filePath,
      sha: blob.sha,
      mode: '100644',
      type: 'blob',
    });

    if (blobs.length % 20 === 0) {
      console.log(`  Created ${blobs.length}/${files.length} blobs...`);
    }
  }

  console.log(`Created all ${blobs.length} blobs`);

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: blobs as any,
  });

  console.log(`Created tree: ${tree.sha}`);

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Initial commit: AI-Powered Legal Document Review Application',
    tree: tree.sha,
    parents: parentSha ? [parentSha] : [],
  });

  console.log(`Created commit: ${commit.sha}`);

  if (parentSha) {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } else {
    try {
      await octokit.git.createRef({
        owner,
        repo,
        ref: 'refs/heads/main',
        sha: commit.sha,
      });
    } catch (err: any) {
      if (err.status === 422) {
        await octokit.git.updateRef({
          owner,
          repo,
          ref: 'heads/main',
          sha: commit.sha,
          force: true,
        });
      } else {
        throw err;
      }
    }
  }

  const repoUrl = `https://github.com/${owner}/${repo}`;
  console.log(`\nSuccessfully pushed all files to: ${repoUrl}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
