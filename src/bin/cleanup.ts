import { program } from 'commander';
import semver from 'semver/preload';
import promptSync from 'prompt-sync';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient, findSavedKey, getConfig, getHumanDate, verifyUser } from './utils';
import { deleteSpecificVersion, getActiveAppVersions } from '../api/versions';
import { checkAppExistsAndHasPermission } from '../api/app';
import { definitions } from './types_supabase';

interface Options {
  apikey: string;
  version: string;
  bundle: string;
  keep: number;
}


const prompt = promptSync();

const removeVersions = (toRemove: definitions["app_versions"][], supabase: SupabaseClient, appid: string, userId: string) => {
  toRemove?.forEach(row => {
    console.log(`Removing ${row.name} created on ${(getHumanDate(row))}`);
    deleteSpecificVersion(supabase, appid, userId, row.name);
  });
}

const getRemovableVersionsInSemverRange = (data: definitions["app_versions"][], bundle: string, nextMajor: string) => {
  const toRemove: definitions["app_versions"][] = [];

  data?.forEach(row => {
    if (semver.gte(row.name, bundle) && semver.lt(row.name, `${nextMajor}`)) {
      toRemove.push(row);
    }
  });
  return toRemove;
}

const loop = (times: number, callback: (i: number) => unknown) => {
  [...Array(times)].forEach((item, i) => callback(i));
};

export const cleanupApp = async (appid: string, options: Options) => {
  const apikey = options.apikey || findSavedKey()
  const { bundle, keep = 4 } = options;

  const config = await getConfig();

  appid = appid || config?.app?.appId
  if (!apikey) {
    program.error('Missing API key, you need to provide an API key to delete your app');
  }
  if (!appid) {
    program.error('Missing argument, you need to provide a appid, or be in a capacitor project');
  }

  const nextMajor = `${semver.inc(bundle, 'major')}`;
  console.log(`Querying available versions in Capgo between ${bundle} and ${nextMajor}`);

  const supabase = createSupabaseClient(apikey)

  const userId = await verifyUser(supabase, apikey);

  // Check we have app access to this appId
  await checkAppExistsAndHasPermission(supabase, appid, apikey);

  // Get all active app versions we might possibly be able to cleanup
  const data = await getActiveAppVersions(supabase, appid, userId);

  console.log(`Total active versions in Capgo: ${data?.length}`);

  if (data?.length === 0) {
    return;
  }

  // Get all app versions that are in the given range
  const toRemove = getRemovableVersionsInSemverRange(data, bundle, nextMajor);

  console.log(`Active versions in Capgo between ${bundle} and ${nextMajor}: ${toRemove?.length}`);

  const removeLast = (recent = true) => {
    const last = toRemove.pop();
    if (last) {
      const humanDate = getHumanDate(last);
      if (recent) {
        console.log(`${last.name} created on ${humanDate} will be kept as it's the last release`);
      } else {
        console.log(`${last.name} created on ${humanDate} will be kept due to config`);
      }
    }
  }

  // Always keep the latest version
  removeLast(true);

  // loop call removeLast until we have use up the keep count
  loop(keep, () => removeLast(false));

  if (toRemove.length === 0) {
    console.log("Nothing to be removed, aborting removal...")
    return;
  }

  // Show the user what will be removed
  toRemove?.forEach(row => {
    console.log(`${row.name} created on ${(getHumanDate(row))} will be removed`);
  });

  // Check user wants to clean that all up
  const result = prompt("Do you want to continue removing the versions specified? Type yes to confirm");
  if (result !== "yes") {
    console.log("Not confirmed, aborting removal...");
    return;
  }

  // Yes, lets clean it up
  console.log("You have confiremd removal, removing versions now");
  removeVersions(toRemove, supabase, appid, userId);
}