import bind from './bind';
import {
  FilePredicate,
  FileType,
  Predicate
} from './matchers';

export class MatchBuilder {
  private readonly fp: FilePredicate[];
  private ft: FileType;

  public constructor() {
    this.fp = [];
    this.ft = FileType.S_IFREG;
    bind(this);
  }

  get fileType(): FileType {
    return this.ft;
  }

  public add(...predicates: FilePredicate[]): MatchBuilder {
    for (const fp of predicates) {
      if (fp.fileType === FileType.S_IFDIR) {
        this.ft = FileType.S_IFDIR;
      }
      this.fp.push(fp);
    }
    
    return this;
  }

  public build(): Predicate {
    return (file) => {
      let match = true;
      for (const item of this.fp) {
        match = match && item.test(file);
      }
      return match;
    };
  }
}
