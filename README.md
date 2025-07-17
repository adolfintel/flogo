# Flogo - Electron-based version
This file will explain how to install and build the Electron-based "native" version of Flogo.

Note: the build process creates files for x86_64.

## GNU/Linux
Prerequisites:
* yarn
* git

Once everything is installed, open the terminal and run these commands to fetch the source code and the required libraries:
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
git checkout electron
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

## Windows
Prerequisites:
* yarn
* git
* Inno Setup

Once everything is installed, open the terminal and run these commands to fetch the source code and the required libraries:
```bash
git clone https://github.com/adolfintel/flogo
cd flogo
git checkout electron
yarn install
```

First, build the unpacked Windows version:
```bash
yarn run buildwin
```

This will place the unpacked files in `out/win-unpacked` and we can now use Inno Setup to create the installer.

Enter the `_SETUP` folder, open `setup-win32.iss` in Inno Setup and hit Compile. This last step CAN be done in Wine if you're trying to build the Windows version from a Linux machine.

If everything goes right, you'll find the installer in the `setup` folder inside `_SETUP`.

## MacOS
Not available yet, use the webapp.
