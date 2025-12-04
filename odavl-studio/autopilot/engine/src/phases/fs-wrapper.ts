// fs-wrapper.ts
import * as fsp from 'node:fs/promises';

export const readFile = fsp.readFile;
export const writeFile = fsp.writeFile;
export const access = fsp.access;
export const mkdir = fsp.mkdir;
export const readdir = fsp.readdir;
export const unlink = fsp.unlink;
export const copyFile = fsp.copyFile;
export const appendFile = fsp.appendFile;
export const rm = fsp.rm;
