# yarn-plugin-npm-creds-from-vault

Avoid storing npm authentication tokens in plaintext on your filesystem.

A plugin to hook the npm authentication process for a selected registry, and retrieve the npm auth token from your own local encrypted storage vault.

Currently only supports GPG-encrypted vault files (.gpg).

## Installation

To install the plugin, run the following command in your terminal:

```bash
yarn plugin import https://github.com/Shogan/yarn-plugin-npm-creds-from-vault/releases/download/v0.0.1/plugin-npm-creds-from-vault.js
```

## Configuration
To configure the plugin, add the following section to your `.yarnrc.yml` file:

```yaml
encryptedTokenAbsoluteFilePath: /Users/exampleUserName/your_encrypted_npm_file.gpg
registry: "https://npm.pkg.github.com" # The registry you want to use the encrypted token for
```

If the registry you select does not match the registry your package is being installed from, then the plugin will not attempt to retrieve the token from the vault, and will fall back to the default Yarn/npm authentication process.

## Usage

1. The plugin hooks the `getNpmAuthenticationHeader` method that yarn uses to retrieve the npm auth token for a given registry.
2. When you first try to install a new package(s) from the selected registry, the plugin will attempt to decrypt the vault file using GPG. GPG's `--decrypt` command is invoked as a child process, so make sure you have GPG installed and properly configured on your system. If required, GPG will prompt you for your passphrase or pin etc...
3. As long as the decryption is successful, the plugin will read the decrypted content of the vault file, and extract the npm auth token, returning it to yarn to use for authentication with the selected registry.
