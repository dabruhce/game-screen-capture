# Electron Application with Overlay Window

This is an Electron application that creates two separate windows: a main application window and an overlay window. The main window is positioned on the left half of the screen, and the overlay window is positioned at the top right, with dimensions of 200x200 pixels.

## Features

- **Main Window**: A standard Electron browser window that can be used for your primary application interface.
- **Overlay Window**: A small, transparent, frameless window that is always on top. It can be moved independently and is positioned at the top right of the screen.
- **Keyboard Events**: Listens for key events using the `uiohook-napi` library, triggering actions like screenshots or creating a match when specific keys are held down.


## Installation

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Run the Application:**
    ```bash
    npm start
    ```

## Usage

- On startup, the application will create two windows:
  - **Main Window**: Positioned on the left half of the screen.
  - **Overlay Window**: Positioned at the top right of the screen at coordinates (880, 0), with a size of 200x200 pixels.

- **Key Bindings:**
  - Hold the **Tab** key for 300ms to trigger a screenshot action.
  - Hold the **Backspace** key for 300ms to trigger the creation of a match.

## Customization

- **Changing Window Positions and Sizes:**
  - Modify the `createWindow` and `createOverlayWindow` functions in `main.js` to adjust the positions and sizes of the main and overlay windows.

- **Overlay Content:**
  - Edit `overlay.html` to customize the content displayed in the overlay window.

## Dependencies

- [Electron](https://www.electronjs.org/) - Build cross-platform desktop apps with JavaScript, HTML, and CSS.
- [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) - Native Node.js module for global keyboard and mouse hooking.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue if you have any suggestions or improvements.

## Acknowledgements

- Thanks to the creators of [Electron](https://www.electronjs.org/) and [uiohook-napi](https://www.npmjs.com/package/uiohook-napi) for making this project possible.

