import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { exit } from 'node:process'
import { program } from 'commander'
import { intro, log, outro } from '@clack/prompts'
import { checkLatest } from '../api/update'
import { encryptChecksumV2, encryptSourceV2 } from '../api/cryptoV2'
import { baseKey, getConfig } from '../utils'

interface Options {
  key?: string
  keyData?: string
}

export async function encryptZipV2(zipPath: string, checksum: string, options: Options) {
  intro(`Encryption`)

  await checkLatest()
  const extConfig = await getConfig()

  const hasPrivateKeyInConfig = !!extConfig.config.plugins?.CapacitorUpdater?.privateKey
  const hasPublicKeyInConfig = !!extConfig.config.plugins?.CapacitorUpdater?.publicKey

  if (hasPrivateKeyInConfig)
    log.warning(`There is still a privateKey in the config`)

  // write in file .capgo the apikey in home directory

  if (!existsSync(zipPath)) {
    log.error(`Error: Zip not found at the path ${zipPath}`)
    program.error('')
  }

  if (!hasPublicKeyInConfig) {
    log.warning(`Warning: Missing Public Key in config`)
  }

  const keyPath = options.key || baseKey
  // check if publicKey exist

  // let publicKey = options.keyData || ''
  let privateKey = options.keyData || ''

  if (!existsSync(keyPath) && !privateKey) {
    log.warning(`Cannot find a private key at ${keyPath} or as a keyData option`)
    log.error(`Error: Missing key`)
    program.error('')
  }
  else if (existsSync(keyPath)) {
    // open with fs key path
    const keyFile = readFileSync(keyPath)
    privateKey = keyFile.toString()
  }

  // let's doublecheck and make sure the key we are using is the right type based on the decryption strategy
  if (privateKey && !privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
    log.error(`the private key provided is not a valid RSA Private key`)
    program.error('')
  }

  const zipFile = readFileSync(zipPath)
  const encodedZip = encryptSourceV2(zipFile, privateKey)
  const encodedChecksum = encryptChecksumV2(checksum, privateKey)
  log.success(`Encoded Checksum: ${encodedChecksum}`)
  log.success(`ivSessionKey: ${encodedZip.ivSessionKey}`)
  // write decodedZip in a file
  writeFileSync(`${zipPath}_encrypted.zip`, encodedZip.encryptedData)
  log.success(`Encrypted zip saved at ${zipPath}_encrypted.zip`)
  outro(`Done ✅`)
  exit()
}