import {EventEmitter} from 'events';
import * as fs from 'fs';
import {File} from '../file';

function createPathError(name: string): Error {
  return new Error(`'${name}' is not a valid path`);
}

export type EntryFilter = (file: File) => boolean;

export class FileEmitter extends EventEmitter {
  private readonly root: File;
  private stopped: boolean;
  private pending: number;
  private readonly accept: EntryFilter;

  constructor(root: string, accept: EntryFilter = () => true) {
    super();
    this.root = new File(root);
    this.accept = accept;
    this.stopped = true;
    this.pending = 0;
  }

  public stop(): void {
    this.stopped = true;
    this.emit('stop');
  }

  public async start(): Promise<void> {
    this.stopped = false;
    if (!fs.existsSync(this.root.getName())) {
      this.emit('error', createPathError(this.root.getName()));
      return;
    }
    return this.walk(this.root);
  }

  public async walk(directory: File): Promise<void> {
    if (this.stopped) {
      this.stop();
    }

    try {
      this.pending += 1;

      const files = await directory.getFiles();
      for (const file of files) {
        if (!this.accept(file)) {
          continue;
        }

        if (await file.isFile()) {
          this.emit('file', file);
        } else if (await file.isDirectory()) {
          let skip = false;
          this.emit('directory', file, () => {
            skip = true;
          });

          if (!skip) {
            await this.walk(file);
          }
        }
      }
    } catch (e) {
        this.emit('error', e);
    } finally {
      this.pending -= 1;
      if (this.pending === 0) {
        this.stop();
      }
    }
  }
}
