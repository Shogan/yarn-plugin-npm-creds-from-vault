import {
  Plugin,
  SettingsType,
  Ident,
  Configuration,
} from '@yarnpkg/core';
import { exec } from 'child_process';

function run(cmd: string) {
	return new Promise((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) return reject(error)
			if (stderr) console.error('GPG CLI [stderr]', stderr)
			resolve(stdout)
		})
	});
}

declare module '@yarnpkg/core' {
  interface ConfigurationValueMap {
    encryptedTokenAbsoluteFilePath: string;
    registry: string;
  }
}

const plugin: Plugin = {
  configuration: {
    encryptedTokenAbsoluteFilePath: {
      description: 'The absolute file path of your GPG encrypted npm registry token)',
      type: SettingsType.STRING,
      default: null,
    },
    registry: {
      description: 'The registry that the decrypt hook should target',
      type: SettingsType.STRING,
      default: null,
    },
  },
  hooks: {
    getNpmAuthenticationHeader: (
      currentHeader: string | undefined,
      registry: string, {configuration, ident,}: {
				configuration: Configuration;
				ident?: Ident;
    }) => {
      const configuredRegistry = configuration.get('registry');
      const configuredGpgTokenAbsPath = configuration.get('encryptedTokenAbsoluteFilePath');
      if (configuredRegistry !== null && configuredRegistry !== undefined) {
        if (registry !== configuredRegistry) {
          console.log(`Skipping decryption for registry: ${registry} (we're only hooked for: ${configuredRegistry})`);
          return currentHeader;
        }
      }
      
      console.log(`Getting npm authentication token for registry: ${registry}`);
      console.log(`Current header: ${currentHeader}`);
      
      let tokenFilePath = configuredGpgTokenAbsPath || process.env.GPG_SOURCE_TOKEN_FILE_PATH;
      if (!tokenFilePath) {
        throw new Error('No GPG token absolute file path or GPG source token file path (env variable GPG_SOURCE_TOKEN_FILE_PATH) configured');
      }

      return run(`gpg --decrypt ${tokenFilePath}`)
        .then((decryptedString) => {
          const token = String(decryptedString).trim();
          console.log(`Decrypted token for registry: ${registry}`);
          return token;
        })
        .catch((error) => {
          console.error(`Failed to decrypt token stored at ${tokenFilePath} for registry ${registry}:`, error);
          return currentHeader;
        });
    },
  },
  commands: [],
};

export default plugin;
