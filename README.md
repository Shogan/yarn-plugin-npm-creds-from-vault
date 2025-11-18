# yarn-plugin-npm-creds-from-vault

Avoid storing npm authentication tokens in plaintext on your filesystem.

A plugin to hook the npm authentication process for a selected registry, and retrieve the npm auth token from your own local encrypted storage vault.

## Requirements

Currently only supports GPG (OpenPGP) encrypted vault files (.gpg). This tooling is therefore a requirement for this plugin to work. You can install gnupg on macOS for example using homebrew. Alternatively, for other platforms, the standard methods can be followed to install there.

macOS example:

```bash
brew install gnupg
# optionally if you want to configure gpg to use pinentry-mac for passphrase prompts (e.g. in combination with a hardware token like a Yubikey, you may want to install pinentry-mac as well)
brew install pinentry-mac
```

## Plugin installation

To install the plugin, run the following command in your terminal (where you specify the release version to install):

```bash
yarn plugin import https://github.com/Shogan/yarn-plugin-npm-creds-from-vault/releases/download/v0.0.4/plugin-npm-creds-from-vault.js
```

## Configuration
To configure the plugin, add the following section to your `.yarnrc.yml` file (at either the project or global level):

```yaml
# see below for how to create this encrypted file yourself.
encryptedTokenAbsoluteFilePath: /Users/exampleUserName/my_encrypted_npm_token.gpg
# list of registries you want to use the encrypted token value for. The hook will only be applied for these registries.
# others not included in this list will use normal yarn/npm auth mechanisms, sourcing the token from .yarnrc.yml etc...
includedRegistries:
  - https://npm.pkg.github.com/my-org
```

## Encrypting your npm token file

You can use GPG yourself to encrypt a plaintext file containing your npm auth token, or use the `encrypt token` command provided by the plugin as a convenience wrapper around GPG. You will need to know your GPG key ID (recipient user ID) to use this command. You can list your keys with the `gpg --list-keys` command.

```bash
yarn encrypt token --token YOUR_NPM_TOKEN_GOES_HERE --gpg-key-id 1234CAB48AC641ECFAA1B82CDED29FA111ABCDEF1 --output ~/my_encrypted_npm_token.gpg
```

## Usage

Usage is automatic. Once the plugin is installed and configured, it will automatically hook into yarn's npm authentication process, and invoke gpg to decrypt your token from file when needed. When you attempt to install a package from a registry, the plugin will decrypt the vault file, extract the npm auth token, and provide it to yarn for authentication.

1. The plugin hooks the `getNpmAuthenticationHeader` method that yarn uses to retrieve the npm auth token for a given registry.
2. When you first try to install a new package(s) from the selected registry, the plugin will attempt to decrypt the vault file using GPG. GPG's `--decrypt` command is invoked as a child process, so make sure you have GPG installed and properly configured on your system. If required, GPG will prompt you for your passphrase or pin etc...
3. As long as the decryption is successful, the plugin will read the decrypted content of the vault file, and extract the npm auth token, returning it to yarn to use for authentication with the selected registry.
