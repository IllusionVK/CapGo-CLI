import { loadConfig } from '@capacitor/cli/dist/config';
import AdmZip from 'adm-zip';
import axios from 'axios';
import prettyjson from 'prettyjson';
import { program } from 'commander';
import cliProgress from 'cli-progress';
import { host, hostUpload, supaAnon } from './utils';

const formatType = 'binary';

export const uploadVersion = async (appid, options) => {
  let { version, path, channel } = options
  const { apikey } = options
  channel = channel || 'dev'
  let config
  try {
    config = await loadConfig()
  } catch (err) {
    program.error("No capacitor config file found, run `cap init` first")
  }
  appid = appid || config?.app?.appId
  version = version || config?.app?.package?.version
  path = path || config?.app?.webDir
  if (!apikey) {
    program.error("Missing API key, you need to provide a API key to add your app")
  }
  if(!appid || !version || !path) {
    program.error("Missing argument, you need to provide a appid and a version and a path, or be in a capacitor project")
  }
  console.log(`Upload ${appid}@${version} from path ${path}`)
  const b1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_grey)
  try {
    const zip = new AdmZip()
    zip.addLocalFolder(path)
    console.log('Uploading...')
    const appData = zip.toBuffer().toString(formatType)
    b1.start(1, 0, {
      speed: "N/A"
    })
    const res = await axios({
      method: 'POST',
      url: hostUpload,
      data: {
        version,
        appid,
        channel,
        format: formatType,
        app: appData,
      },
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey,
        authorization : `Bearer ${supaAnon}`
      }})
    if (res.status !== 200) {
      program.error(`Server Error \n${prettyjson.render(res.data || "")}`)
    }
    b1.update(1)
    b1.stop()
  } catch (err) {
    b1.stop()
    if (err.response) {
      program.error(`Network Error \n${prettyjson.render(err.response?.data || "")}`)
    } else {
      program.error(`Network Error \n${prettyjson.render(err || "")}`)
    }

  }
  console.log("App uploaded to server")
  console.log(`Try it in mobile app: ${host}`)
  console.log(`Or set the channel ${channel} as public here: ${host}/app/package/${appid}`)
  console.log("To use with live update in your own app")
}