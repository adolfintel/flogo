# Flogo - Build instructions
Flogo uses npm and vite as a build system and can be built very easily.

## Step 1: Tools

#### GNU/Linux
You'll need `npm` and `git`, install them through your package manager.

#### Windows
Download and install [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [git](https://git-scm.com/downloads/win) and [Inno Setup](https://jrsoftware.org/isdl.php).

#### macOS
First, install [Homebrew](https://brew.sh/).

Then, open a terminal and run the following commands to download the required tools:  
```bash
brew install git
brew install node
brew install npm
```

## Step 2: Source code preparation
Open a terminal and run these commands to fetch the source code and the requried libraries:  
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
npm install
```

This will automatically download all the required dependencies.

## Step 3: Building

#### Webapp (PWA)
To build the PWA, run the following command:  
```bash
npm run build
```

Once built, you'll find the files to upload to your web server in the `dist` folder.

#### Electron version
To build the Electron version of Flogo for your current OS and architecture, run the following command:  
```bash
npm run electron:build
```

Once built, you'll find the executable files in the `release` folder. For GNU/Linux, this is in the form of both unpacked files and an AppImage, for macOS, you'll find both unpacked files and a dmg.

Note: no code signing is done automatically, see the instructions below for building a signed version on macOS.

It is also possible to cross-build for other platforms with the following commands:
* `npm run electron:build-win-x64`: Windows (x64, unpacked)
* `npm run electron:build-win-arm64`: Windows (ARM, unpacked)
* `npm run electron:build-linux-x64`: GNU/Linux (x64, unpacked)
* `npm run electron:build-linux-arm64`: GNU/Linux (ARM, unpacked)
* `npm run electron:build-linux-x64-appimage`: GNU/Linux (x64, AppImage)
* `npm run electron:build-linux-arm64-appimage`: GNU/Linux (ARM, AppImage)
* `npm run electron:build-linux-mac-arm`: macOS (Apple Silicon, unpacked)
* `npm run electron:build-linux-mac-intel`: macOS (Intel, unpacked)
* `npm run electron:build-linux-mac-arm-dmg`: macOS (Apple Silicon, dmg)
* `npm run electron:build-linux-mac-intel-dmg`: macOS (Intel, dmg)

Notes:
* .dmg creation is only available on macOS
* Code signing for Windows and macOS is not possible when cross-building

##### Windows installer
To build the installer for the Windows version, after running one of the above commands to build it, enter the `windows-installer` folder and open `setup-win-x64.iss` or `setup-win-arm64.iss` in Inno Setup and hit Compile. This last step can be done in Wine if you're trying to build the Windows version from a Linux machine.

If everything goes right, you'll find the installer exe files in the `release` folder.

If you have a certificate for code signing, you will need to do it manually using signtool in Windows. This is not mandatory.

##### Signing and notarizing the macOS version
Note: that a **paid** Apple developer key is required to sign, notarize and distribute the app. Once you have the account, see [here](https://www.npmjs.com/package/electron-builder-notarize) for how to configure it. Without a developer account, you can build and test the app, but other users won't be able to install it without disabling GateKeeper.

To build, sign, and notarize the app, here's what you need to do:
1. Generate a specific app password by going to https://account.apple.com/account/manage, clicking on Sign-In and Security section and then select App-Specific Passwords
2. Run this command:
```bash
export APPLE_ID="yourappleuser@email.com" APP_ID="TheAppNameYouWroteWhenGeneratingAppPassword" APPLE_APP_SPECIFIC_PASSWORD="the-generated-app-password" APPLE_ID_PASSWORD="the-generated-app-password" APPLE_TEAM_ID="YOUR10CHARDEVELOPERTEAMID" && npm run electron:build-mac-arm-dmg
```

## Testing the app without building (for development)
To test the webapp locally, use this command:
```bash
npm run dev
```

To test the Electron version without building it, use this command:
```bash
npm run electron:dev
```
