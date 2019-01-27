import { EventEmitter } from 'events';
import * as File from 'file-js';
import bind from '../bind';

export class FileEmitter extends EventEmitter {
  private root: File;
  private stopped: boolean;
  private pending: number;

  constructor(root) {
    super();
    this.root = File.create(root);
    this.stopped = true;
    this.pending = 0;
    bind(this);
  }

  public stop(): void {
    this.stopped = true;
    this.emit('stop');
  }

  public start(): void {
    this.stopped = false;
    this.walk(this.root);
  }

  private readDir(dir): any {
    return dir.getFiles()
      .catch((e) => {
        this.emit('error', e);
        throw e;
      })
      .finally(() => {
        // tslint:disable:no-increment-decrement
        this.pending--;
      });
  }

  public async walk(dir): Promise<void> {
    if (this.stopped) { return; }

    this.pending++;
    this.readDir(dir)
      .each((file) => {
        if (this.stopped) { return; }

        let isDir = false;
        try {
          isDir = file.isDirectorySync();
        } catch (e) {
          this.emit('error', e);
        }

        if (isDir) {
          let skip = false;
          this.emit('directory', file, () => {
            skip = true;
          });
          if (!skip) {
            this.walk(file);
          }
        } else {
          this.emit('file', file);
        }
      })
      .then(() => {
        if (this.pending === 0) {
          this.emit('end');
        }
      })
      .catch(() => { });
  }
}
