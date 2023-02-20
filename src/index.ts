import { program } from 'commander';
import { decryptZip } from './bundle/decrypt';
import { encryptZip } from './bundle/encrypt';
import { addApp } from './app/add';
import { getInfo } from './app/info';
import { manageKey } from './key';
import { deleteVersion } from './bundle/delete';
import { setChannel } from './channel/set';
import { uploadVersion } from './bundle/upload';
import pack from '../package.json'
import { login } from './login';
import { listApp } from './app/list';
import { cleanupApp } from './bundle/cleanup';
import { addChannel } from './channel/add';
import { deleteChannel } from './channel/delete';
import { listChannels } from './channel/list';
import { setApp } from './app/set';
import { deleteApp } from './app/delete';

program
  .description('Manage packages and bundle versions in capgo Cloud')
  .version(pack.version);

program
  .command('login [apikey]')
  .alias('l')
  .description('Save apikey to your machine or folder')
  .action(login)
  .option('--local', 'Only save in local folder');

const app = program
  .command('app')
  .description('Manage app');

app
  .command('add [appid]')
  .alias('a')
  .description('Add a new app in capgo Cloud')
  .action(addApp)
  .option('-n, --name <name>', 'app name')
  .option('-i, --icon <icon>', 'app icon path')
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

app
  .command('delete [appid]')
  .alias('d')
  .description('Delete an app in capgo Cloud')
  .action(deleteApp)
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

app
  .command('list [appid]')
  .alias('l')
  .description('list apps in capgo Cloud')
  .action(listApp)
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

app
  .command('set [appid]')
  .alias('s')
  .description('Set an app in capgo Cloud')
  .action(setApp)
  .option('-n, --name <name>', 'app name')
  .option('-i, --icon <icon>', 'app icon path')
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

app
  .command('doctor')
  .description('Get info about your Capgo app install')
  .action(getInfo);


const bundle = program
  .command('bundle')
  .description('Manage bundle');

bundle
  .command('upload [appid]')
  .alias('u')
  .description('Upload a new bundle in capgo Cloud')
  .action(uploadVersion)
  .option('-a, --apikey <apikey>', 'apikey to link to your account')
  .option('-p, --path <path>', 'path of the folder to upload')
  .option('-c, --channel <channel>', 'channel to link to')
  .option('-e, --external <url>', 'link to external url intead of upload to capgo cloud')
  .option('--key <key>', 'custom path for public signing key')
  .option('--keyData <keyData>', 'base64 public signing key')
  .option('--no-key', 'ignore signing key and send clear update')
  .option('--display-iv-session', 'Show in the console the iv and session key used to encrypt the update')
  .option('-b, --bundle <bundle>', 'bundle version number of the file to upload');

bundle
  .command('delete [appid]')
  .alias('d')
  .description('Delete a bundle in capgo Cloud')
  .action(deleteVersion)
  .option('-a, --apikey <apikey>', 'apikey to link to your account')

bundle
  .command('list [appid]')
  .alias('l')
  .description('List bundle in capgo Cloud')
  .action(listApp)
  .option('-a, --apikey <apikey>', 'apikey to link to your account');

bundle
  .command('cleanup [appid]')
  .alias('c')
  .action(cleanupApp)
  .description('Cleanup bundle in capgo Cloud')
  .option('-b, --bundle <bundle>', 'bundle version number of the app to delete')
  .option('-a, --apikey <apikey>', 'apikey to link to your account')
  .option('-k, --keep <keep>', 'number of version to keep')
  .option('-f, --force', 'force removal');

bundle
  .command('decrypt [zipPath] [sessionKey]')
  .alias('l')
  .description('Decrypt a signed zip bundle')
  .action(decryptZip)
  .option('--key <key>', 'custom path for private signing key')
  .option('--keyData <keyData>', 'base64 private signing key');

bundle
  .command('encrypt [zipPath]')
  .description('Encrypt a zip bundle')
  .action(encryptZip)
  .option('--key <key>', 'custom path for private signing key')
  .option('--keyData <keyData>', 'base64 private signing key');

const channel = program
  .command('channel')
  .description('Manage channel');

channel
  .command('add [channelid] [appid]')
  .alias('a')
  .description('Create channel')
  .action(addChannel)

channel
  .command('delete [channelid] [appid]')
  .alias('d')
  .description('Delete channel')
  .action(deleteChannel)

channel
  .command('list [appid]')
  .alias('l')
  .description('List channel')
  .action(listChannels)

channel
  .command('set [channelid] [appid]')
  .alias('s')
  .description('Set channel')
  .action(setChannel)
  .option('-a, --apikey <apikey>', 'apikey to link to your account')
  .option('-b, --bundle <bundle>', 'bundle version number of the file to set')
  .option('-s, --state <state>', 'set the state of the channel, default or normal')
  .option('--latest', 'get the latest version key in the package.json to set it to the channel')
  .option('--downgrade', 'Allow to downgrade to version under native one')
  .option('--no-downgrade', 'Disable downgrade to version under native one')
  .option('--upgrade', 'Allow to upgrade to version above native one')
  .option('--no-upgrade', 'Disable upgrade to version above native one')
  .option('--ios', 'Allow sending update to ios devices')
  .option('--no-ios', 'Disable sending update to ios devices')
  .option('--android', 'Allow sending update to android devices')
  .option('--no-android', 'Disable sending update to android devices')
  .option('--self-assign', 'Allow to device to self assign to this channel')
  .option('--no-self-assign', 'Disable devices to self assign to this channel');

program
  .command('key [option]')
  .description('Save base64 signing key in capacitor config, usefull for CI')
  .action(manageKey)
  .option('-f, --force', 'force generate a new one');

program
  .command('upload [appid]')
  .alias('u')
  .description('(Deprecated) Upload a new bundle to capgo Cloud')
  .action(uploadVersion)
  .option('-a, --apikey <apikey>', 'apikey to link to your account')
  .option('-p, --path <path>', 'path of the folder to upload')
  .option('-c, --channel <channel>', 'channel to link to')
  .option('-e, --external <url>', 'link to external url intead of upload to capgo cloud')
  .option('--key <key>', 'custom path for public signing key')
  .option('--keyData <keyData>', 'base64 public signing key')
  .option('--no-key', 'ignore signing key and send clear update')
  .option('--display-iv-session', 'Show in the console the iv and session key used to encrypt the update')
  .option('-b, --bundle <bundle>', 'bundle version number of the file to upload');

program.parseAsync();