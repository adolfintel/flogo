# Flogo - Build instructions

## Webapp (PWA)
Just copy all the downloaded files to the root of your web server. You will need a valid HTTPS certificate.

## Electron version

### GNU/Linux
Note: the build process creates files for x86_64.

Prerequisites:
* yarn
* git

Once everything is installed, open the terminal and run these commands to fetch the source code and the required libraries:
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
yarn install
```

You should now have all the required libraries.

To build an unpacked Linux version, run:
```bash
yarn run buildlinux
```

The unpacked files will be in `out/linux-unpacked` and you can run the `flogo` executable inside.

To build the AppImage version, run:
```bash
yarn run buildlinuxappimage
```

The AppImage file will be in the `out` folder.

### Windows
Note: the build process creates files for x86_64.

Prerequisites:
* yarn
* git
* Inno Setup

Once everything is installed, open the terminal and run these commands to fetch the source code and the required libraries:
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
yarn install
```

First, build the unpacked Windows version:
```bash
yarn run buildwin
```

This will place the unpacked files in `out/win-unpacked` and we can now use Inno Setup to create the installer.

Enter the `_SETUP` folder, open `setup-win32.iss` in Inno Setup and hit Compile. This last step CAN be done in Wine if you're trying to build the Windows version from a Linux machine.

If everything goes right, you'll find the installer in the `setup` folder inside `_SETUP`.

### MacOS
Prerequisites:
* A recent-ish Mac
* yarn
* git

Once everything is installed, open the terminal and run these commands to fetch the source code and the required libraries:
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
yarn install
```

To build the .app for Apple Silicon use the following command:
```bash
yarn run buildmacarm
```

To build the .dmg for Apple Silicon use the following command:
```bash
yarn run buildmacarmdmg
```

To build the .app for Intel use the following command:
```bash
yarn run buildmacintel
```

To build the .dmg for Intel use the following command:
```bash
yarn run buildmacinteldmg
```

The output files will be created in the `out` folder.

Note that a **paid** Apple developer key is required to sign and distribute the app.
