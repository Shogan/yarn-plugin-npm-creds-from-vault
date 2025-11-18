import { BaseCommand } from '@yarnpkg/cli';
import {
  Plugin,
  SettingsType,
  Ident,
  Configuration,
} from '@yarnpkg/core';
import { exec } from 'child_process';
import { Option } from 'clipanion';

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
    includedRegistries: string[];
  }
}

class EncryptTokenCommand extends BaseCommand {
  static paths = [
    [`encrypt`, `token`],
  ];

  token = Option.String(`--token`, ``, {
    description: `The encrypted value/string to store with GPG`,
  });

  recipientUserId = Option.String(`--gpg-key-id`, ``, {
    description: `The 'recipient USER ID' (GPG key id) to use to encrypt the token`,
  });

  outputFilePath = Option.String(`--output`, ``, {
    description: `The absolute file path to store the encrypted token .gpg file`,
  });

  async execute() {
    if (!this.token) {
      throw new Error('Token is required. Please provide a value using the --token option.');
    }
    if (!this.recipientUserId) {
      throw new Error('GPG key id is required. Please provide a value using the --gpg-key-id option.');
    }
    if (!this.outputFilePath) {
      throw new Error('Output file path is required. Please provide a value using the --output option.');
    }

    await run(`echo ${this.token} | gpg --encrypt -r ${this.recipientUserId} -o ${this.outputFilePath}`);
    console.log(`Token stored at ${this.outputFilePath}`);
  }
}

const plugin: Plugin = {
  configuration: {
    encryptedTokenAbsoluteFilePath: {
      description: 'The absolute file path of your GPG encrypted npm registry token.',
      type: SettingsType.STRING,
      default: null,
    },
    includedRegistries: {
      description: 'List of registries that the decrypt hook should target. Only those listed here will use the encrypted token value for authentication.',
      isArray: true,
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
      const includedRegistries = configuration.get('includedRegistries');
      const configuredGpgTokenAbsPath = configuration.get('encryptedTokenAbsoluteFilePath');
      if (includedRegistries !== null && includedRegistries !== undefined) {
        for (const includedRegistry of includedRegistries as string[]) {
          if (registry === includedRegistry) {
            console.log(`Using gpg encrypted token for registry: ${registry}`);
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
          }
        }
      }

      console.log(`Skipping decryption for registry: ${registry}`);
      return currentHeader;
    },
  },
  commands: [EncryptTokenCommand],
};

export default plugin;
