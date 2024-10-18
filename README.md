# URL Filter and Tracker Chrome Extension

## Overview

The URL Filter and Tracker Chrome extension is a powerful tool for monitoring and filtering web page accesses. It allows users to filter specific URLs or domains and log all accesses to them.

## Key Features

1. **URL Filtering**: Define custom filters based on hostnames and protocols.
2. **Real-time Tracking**: Track all accesses to the filtered URLs in real-time.
3. **Detailed Information**: View detailed information for each captured URL, including protocol, hostname, path, and query parameters.
4. **Badge Display**: The number of currently captured URLs is displayed as a badge on the extension icon.
5. **User-friendly Interface**: Easily add, edit, and delete filters through the popup interface.

## Installation

1. Download the source code or clone the repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the folder containing the extension code.

## Usage

1. **Adding Filters**: 
   - Click the extension icon to open the popup.
   - Enter the hostname and select the protocol.
   - Click "Add" to add the filter.

2. **Viewing Filtered URLs**:
   - Filtered URLs are displayed in the popup under "Matched URLs".
   - Click on a URL to view its details.

3. **Managing Filters**:
   - Existing filters are shown in the "Current Filters" section.
   - Use the edit and delete buttons to modify or remove filters.

4. **Clearing the URL List**:
   - Click the "Clear List" button to remove all captured URLs.

## Technical Details

- Built for Chrome using Manifest V3.
- Uses `declarativeNetRequest` for efficient URL filtering.
- Implements real-time badge updates to show the number of captured URLs.

## Privacy

This extension operates locally in your browser. No data is sent to external servers.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.
