# Flogo - Build instructions

## Webapp (PWA)
Just copy all the downloaded files to the root of your web server, no build required. You will need a valid HTTPS certificate.

## Electron version

### Step 1: Tools

#### GNU/Linux
You'll need `yarn` and `git`, install them through your package manager.

#### Windows
Download and install [yarn](https://classic.yarnpkg.com/en/docs/install#windows-stable), [git](https://git-scm.com/downloads/win) and [Inno Setup](https://jrsoftware.org/isdl.php).

Note: the Windows version can be built on GNU/Linux, just use Wine to install Inno Setup.

#### MacOS
Note: a recent-ish mac is required to build the MacOS version

First, install [Homebrew](https://brew.sh/).

Then, open a terminal and run the following commands to download the required tools:  
```bash
brew install git
brew install node
brew install yarn
```

### Step 2: Source code preparation (all OS)
Open a terminal and run these commands to fetch the source code and the requried libraries:  
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
yarn install
```

### Step 3: Building

#### GNU/Linux
To build an unpacked GNU/Linux version, use the following command:  
```bash
yarn run build-linux-architecture
```

Replacing `architecture` with either `x64` for an x86_64 build or `arm` for an aarch64 build.

You can also build an AppImage with the following command:  
```bash
yarn run build-linux-architecture-appimage
```

The output files will be placed in the `out` folder.

#### Windows
To build an unpacked Windows version, use the following command:  
```bash
yarn run build-win-architecture
```

Replacing `architecture` with either `x64` for an x86_64 build or `arm` for an aarch64 build.

To build the installer (x64 only), enter the `_SETUP` folder, open `setup-win32.iss` in Inno Setup and hit Compile. This last step can be done in Wine if you're trying to build the Windows version from a Linux machine.

If everything goes right, you'll find the installer exe file in the `setup` folder inside `_SETUP`.

#### MacOS
To build an unpacked MacOS version, use the following command:  
```bash
yarn run build-mac-architecture
```

Replacing `architecture` with either `intel` for an x86_64 build or `arm` for an Apple Silicon build.

You can also build a .dmg with the following command:  
```bash
yarn run build-mac-architecture-dmg
```

The output files will be placed in the `out` folder.

Note that a **paid** Apple developer key is required to sign and distribute the app.
