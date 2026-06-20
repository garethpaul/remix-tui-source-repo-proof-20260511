#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function isPathContained(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === '' ||
    (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath))
  );
}

function isDirectoryWithoutSymlink(directoryPath) {
  try {
    const stat = fs.lstatSync(directoryPath);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch (error) {
    return false;
  }
}

function isContainedRegularFile(rootPath, filePath) {
  try {
    if (!isDirectoryWithoutSymlink(rootPath) || !isPathContained(rootPath, filePath)) {
      return false;
    }

    const fileStat = fs.lstatSync(filePath);
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      return false;
    }

    const realRoot = fs.realpathSync(rootPath);
    const realFile = fs.realpathSync(filePath);
    return isPathContained(realRoot, realFile);
  } catch (error) {
    return false;
  }
}

function isValidIsoCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

module.exports = {
  isContainedRegularFile,
  isDirectoryWithoutSymlink,
  isPathContained,
  isValidIsoCalendarDate,
};
