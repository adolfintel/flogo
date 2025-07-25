[![Flogo logo](images/logo_large.webp)](https://flogo.fdossena.com)

__Flogo__ is a free and open source programming language for beginners, designed for learning programming basics within a friendly environment using flow charts.

[Try Flogo](https://flogo.fdossena.com)

## Features
* Several types of variables: Integer, Real, String, Boolean; variables can also be declared with an initial value
* Strong, statically typed
* Standard C-like syntax for expressions to make it easier to switch to a "real" prorgamming language
* Detection of errors such as overflows, uninitialized variables, etc.
* All standard loop types: Do-While, While and For (basic-style)
* Lazy evaluation of boolean expressions
* Lots of built-in functions (see documentation for a complete list)
* Execution speed control and step-by-step mode to better follow the flow of the program; a turbo mode is also available to run larger programs at maximum speed
* Easy to use UI with Undo/Redo, Cut/Copy/Paste and keyboard shortcuts
* Chat-like Input/Output UI, similar to Flowgorithm
* Several built-in themes
* Very small and optimized, can easily run on an old low-end laptop
* Touchscreen and mobile support
* Export to SVG and PNG
* Built-in documentation
* Runs on all modern browsers, can be installed as a PWA and run completely offline

## Screenshots
![Screenshot](.github/screenshot1.png)
![Screenshot](.github/screenshot2.png)
![Screenshot](.github/screenshot3.png)
![Screenshot](.github/screenshot4.png)
![Mobile screenshot](.github/screenshot5.png)
![Mobile screenshot](.github/screenshot6.png)
![Mobile screenshot](.github/screenshot7.png)

## Example programs
__Basics__
* [Sum of 2 integers](https://downloads.fdossena.com/geth.php?r=flogo-demo-01)
* [Seconds to hours, minutes and seconds](https://downloads.fdossena.com/geth.php?r=flogo-demo-02)
* [Dice rolls](https://downloads.fdossena.com/geth.php?r=flogo-demo-03)

__Loops__
* [Average](https://downloads.fdossena.com/geth.php?r=flogo-demo-04)
* [Factorial](https://downloads.fdossena.com/geth.php?r=flogo-demo-05)
* [Speed camera](https://downloads.fdossena.com/geth.php?r=flogo-demo-06)
* [Street light](https://downloads.fdossena.com/geth.php?r=flogo-demo-07)
* [Temperatures (min-max)](https://downloads.fdossena.com/geth.php?r=flogo-demo-08)

__Strings__
* [Palindrome](https://downloads.fdossena.com/geth.php?r=flogo-demo-09)
* [Decimal to binary](https://downloads.fdossena.com/geth.php?r=flogo-demo-10)
* [String trimming](https://downloads.fdossena.com/geth.php?r=flogo-demo-11)
* [Tip calculator](https://downloads.fdossena.com/geth.php?r=flogo-demo-12)
* [Anagram](https://downloads.fdossena.com/geth.php?r=flogo-demo-13)
* [Date and Time](https://downloads.fdossena.com/geth.php?r=flogo-demo-16)

__Mini games__
* [Rock, paper, scissors](https://downloads.fdossena.com/geth.php?r=flogo-demo-14)
* [Quasar (similar to blackjack)](https://downloads.fdossena.com/geth.php?r=flogo-demo-15)

## Future features
* Turtle graphics (Planned for v1.2 series)
* Arrays (Planned for v1.3 series)
* Functions (Planned for v1.4 series)

## Downloads
[Run Flogo](https://flogo.fdossena.com), it runs directly in your browser and be installed as a PWA on any device.

[Windows (x64)](https://downloads.fdossena.com/geth.php?r=flogo-win)  
[Windows (ARM)](https://downloads.fdossena.com/geth.php?r=flogo-win-arm)  

[Linux (AUR package)](https://aur.archlinux.org/packages/flogo)  
[Linux (AppImage for all distros, x64)](https://downloads.fdossena.com/geth.php?r=flogo-linux-appimage)  
[Linux (AppImage for all distros, ARM)](https://downloads.fdossena.com/geth.php?r=flogo-linux-arm-appimage)  

[macOS (dmg for Apple Silicon)](https://downloads.fdossena.com/geth.php?r=flogo-mac-arm)  
[macOS (dmg for Intel)](https://downloads.fdossena.com/geth.php?r=flogo-mac-intel)  

## How to build
If you're a developer, see `BUILDING.md` for instructions on how to build the app.

## License
Copyright (C) 2025 Federico Dossena

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 

__Credits:__
* [Konva](https://konvajs.org/): Object-oriented JS canvas library (MIT License)
* [jsep](https://ericsmekens.github.io/jsep/): JS expression parser (MIT License)
* [SVGCanvas](https://zenozeng.github.io/svgcanvas/): SVG export library for JS canvas (MIT License)
* [Material Design Icons](https://marella.github.io/material-design-icons): Icons used throughout the application (Apache-2.0 License)
* Fonts distributed under the [SIL Open Font License](https://openfontlicense.org/): Noto Sans, Roboto Mono, Monoton, Caveat, Cinzel
* Some CC0 graphics from [SVG Repo](https://www.svgrepo.com/)
* The Electron-based versions of the app contain a modified icon from [KDE Breeze Icons](https://github.com/KDE/breeze-icons) (LGPL 2.1)
