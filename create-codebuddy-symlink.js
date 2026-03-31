import { symlinkDir } from 'symlink-dir';

symlinkDir('./.agents', './.codebuddy').catch(err => console.error(err));
