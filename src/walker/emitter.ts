import {EventEmitter} from 'events';
import {File} from 'file-js';
import * as fs from 'fs';
import bind from '../bind';
import {newFile} from '../files';

function createPathError(name: string): Error {
  return new Error(`'${name}' is not a valid path`);
}

export class FileEmitter extends EventEmitter {
  private readonly root: File;
  private stopped: boolean;
  private pending: number;
  private readonly abortOnError: boolean;

  constructor(root: string) {
    super();
    this.root = newFile(root);
    this.stopped = true;
    this.pending = 0;
    this.abortOnError = false;
    bind(this);
  }

  public stop(): void {
    this.stopped = true;
    this.emit('stop');
  }

  public start(): Promise<void> {
    this.stopped = false;
    return this.walk(this.root);
  }

  // TODO: depth?
  public async walk(directory: File): Promise<void> {
    if (this.stopped) {
      return this.stop();
    }

    if (!fs.existsSync(directory.getName())) {
      this.emit('error', createPathError(directory.getName()));
      return;
    }

    try {
      this.pending += 1;

      const files = await directory.getFiles();
      for (const file of files) {
        if (!fs.existsSync(file.getName())) {
          if (this.abortOnError) {
             this.stop();
          }
          this.emit('error', createPathError(file.getName()));
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
