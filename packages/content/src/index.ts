import fs from 'fs';
import path from 'path';

export interface ContentStage {
  slug: string;
  stepNumber: number;
  title: string;
  validationType: 'CLI_LOCAL' | 'GITLAB_API';
  theoryMd: string;
  missionMd: string;
  hints: string[];
}

export interface ContentTrack {
  slug: string;
  title: string;
  description: string;
  order: number;
  stages: ContentStage[];
}

export function loadAllTracks(customBaseDir?: string): ContentTrack[] {
  const tracksDir = customBaseDir || path.resolve(process.cwd(), 'packages/content/tracks');
  if (!fs.existsSync(tracksDir)) {
    // Tenta caminho relativo comum caso executado dentro de apps/web
    const altDir = path.resolve(process.cwd(), '../../packages/content/tracks');
    if (fs.existsSync(altDir)) {
      return loadFromDirectory(altDir);
    }
  }
  return loadFromDirectory(tracksDir);
}

function loadFromDirectory(tracksDir: string): ContentTrack[] {
  if (!fs.existsSync(tracksDir)) {
    return [];
  }

  const trackEntries = fs.readdirSync(tracksDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();

  const tracks: ContentTrack[] = [];

  for (const trackFolder of trackEntries) {
    const trackPath = path.join(tracksDir, trackFolder);
    const manifestPath = path.join(trackPath, 'track.json');
    if (!fs.existsSync(manifestPath)) continue;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const stageEntries = fs.readdirSync(trackPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort();

    const stages: ContentStage[] = [];

    for (const stageFolder of stageEntries) {
      const stagePath = path.join(trackPath, stageFolder);
      const stageMetaPath = path.join(stagePath, 'stage.json');
      const theoryPath = path.join(stagePath, 'theory.md');
      const missionPath = path.join(stagePath, 'mission.md');
      const hintsPath = path.join(stagePath, 'hints.json');

      if (!fs.existsSync(stageMetaPath)) continue;

      const meta = JSON.parse(fs.readFileSync(stageMetaPath, 'utf8'));
      const theoryMd = fs.existsSync(theoryPath) ? fs.readFileSync(theoryPath, 'utf8') : '';
      const missionMd = fs.existsSync(missionPath) ? fs.readFileSync(missionPath, 'utf8') : '';
      const hints = fs.existsSync(hintsPath) ? JSON.parse(fs.readFileSync(hintsPath, 'utf8')) : [];

      stages.push({
        slug: meta.slug,
        stepNumber: meta.stepNumber,
        title: meta.title,
        validationType: meta.validationType,
        theoryMd,
        missionMd,
        hints,
      });
    }

    stages.sort((a, b) => a.stepNumber - b.stepNumber);

    tracks.push({
      slug: manifest.slug,
      title: manifest.title,
      description: manifest.description,
      order: manifest.order,
      stages,
    });
  }

  tracks.sort((a, b) => a.order - b.order);
  return tracks;
}
